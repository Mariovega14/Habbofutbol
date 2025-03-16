"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Jugador, Equipo, Torneo, Partido, EstadisticaJugador, Asistencia, JugadorEquipo
from api.utils import generate_sitemap, APIException, get_client_ip
from flask_cors import CORS
import os
from base64 import b64encode
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import cloudinary.uploader
from cloudinary.uploader import upload
from datetime import datetime


api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/register', methods=['POST'])
def add_new_player():
    body = request.json
    required_fields = ["email", "name", "password", "nickhabbo"]
    
    if not all(body.get(field) for field in required_fields):
        return jsonify({"error": "Todos los datos tienen que estar completos"}), 400

    email, name, password, nickhabbo = [body[field] for field in required_fields]

    if Jugador.query.filter_by(email=email).one_or_none():
        return jsonify({"error": "El jugador ya está registrado"}), 400

    salt = b64encode(os.urandom(32)).decode("utf-8")
    hashed_password = generate_password_hash(f"{password}{salt}")

    new_player = Jugador(
        name=name, email=email, password=hashed_password, salt=salt,
        nickhabbo=nickhabbo, role="jugador", is_active=True
    )

    try:
        db.session.add(new_player)
        db.session.commit()
        return jsonify({"message": "Jugador registrado satisfactoriamente"}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {err.args}"}), 500

@api.route('/jugadores/admin', methods=['POST'])
@jwt_required()
def crear_jugador_admin():
    """Permite al administrador registrar un jugador con un NickHabbo"""
    usuario_actual_id = get_jwt_identity()
    admin = Jugador.query.get(usuario_actual_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso denegado"}), 403

    body = request.json
    nickhabbo = body.get("nickhabbo", "").strip()

    if not nickhabbo:
        return jsonify({"error": "El NickHabbo es obligatorio"}), 400

    if Jugador.query.filter_by(nickhabbo=nickhabbo).first():
        return jsonify({"error": "El NickHabbo ya está en uso"}), 400

    jugador = Jugador(nickhabbo=nickhabbo, is_active=False)

    try:
        db.session.add(jugador)
        db.session.commit()
        return jsonify({"message": "Jugador creado correctamente"}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {str(err)}"}), 500

@api.route('/jugadores', methods=['GET'])
def get_all_players():
    """Lista todos los jugadores con sus equipos y modalidades (Público)"""

    try:
        players = Jugador.query.all()
        
        players_list = []
        for p in players:
            players_list.append({
                "id": p.id,
                "nickhabbo": p.nickhabbo,
                "equipos": [
                    {
                        "id": je.equipo.id,
                        "nombre": je.equipo.nombre,
                        "modalidad": je.equipo.torneo.modalidad  # Obtener modalidad desde el torneo
                    }
                    for je in p.jugadores_equipos
                ]
            })

        return jsonify(players_list), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

    

@api.route('/equipos/<int:equipo_id>/jugadores', methods=['GET'])
def get_jugadores_por_equipo(equipo_id):
    """Obtiene los jugadores de un equipo específico basado en su ID"""
    try:
        equipo = Equipo.query.get(equipo_id)
        if not equipo:
            return jsonify({"error": "Equipo no encontrado"}), 404

        # Accede a los jugadores a través de la tabla intermedia jugadores_equipos
        jugadores = [
            {"id": je.jugador.id, "nickhabbo": je.jugador.nickhabbo}
            for je in equipo.jugadores_equipos  # <- CORREGIDO
        ]

        return jsonify({"jugadores": jugadores}), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


    
@api.route('/admin/players/add_team', methods=['POST'])
@jwt_required()
def add_player_to_team():
    """Añadir un jugador a un equipo con la modalidad del torneo, evitando duplicados"""
    data = request.json
    jugador_id = data.get("jugador_id")
    equipo_id = data.get("equipo_id")

    jugador = Jugador.query.get(jugador_id)
    equipo = Equipo.query.get(equipo_id)

    if not jugador or not equipo:
        return jsonify({"error": "Jugador o equipo no encontrado"}), 404

    modalidad = equipo.torneo.modalidad  # Se obtiene la modalidad desde el torneo

    # Verificar si el jugador ya tiene un equipo en esta modalidad
    jugador_en_modalidad = JugadorEquipo.query.filter_by(jugador_id=jugador_id, modalidad=modalidad).first()

    if jugador_en_modalidad:
        return jsonify({"error": "El jugador ya pertenece a un equipo en esta modalidad"}), 400

    # Si no está en otro equipo en esta modalidad, se agrega
    nuevo_jugador_equipo = JugadorEquipo(jugador_id=jugador.id, equipo_id=equipo.id, modalidad=modalidad)
    db.session.add(nuevo_jugador_equipo)
    db.session.commit()

    return jsonify({"message": "Jugador añadido correctamente"}), 201




@api.route("/remove_team", methods=["DELETE"])
def remove_team():
    data = request.json
    player_id = data.get("player_id")
    team_id = data.get("team_id")

    if not player_id or not team_id:
        return jsonify({"error": "Datos incompletos"}), 400

    # Buscar la relación en la tabla intermedia
    jugador_equipo = JugadorEquipo.query.filter_by(jugador_id=player_id, equipo_id=team_id).first()

    if not jugador_equipo:
        return jsonify({"error": "El jugador no pertenece a este equipo"}), 404

    # Eliminar la relación de la tabla intermedia
    db.session.delete(jugador_equipo)
    db.session.commit()

    return jsonify({"message": "Equipo eliminado correctamente"})
 


@api.route('/jugadores/<int:id>', methods=['PUT'])
@jwt_required()
def modificar_jugador(id):
    usuario_actual_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado
    admin = Jugador.query.get(usuario_actual_id)  # Busca al usuario por ID

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso no autorizado"}), 403

    body = request.json
    nuevo_nick = body.get("nickhabbo")

    if not nuevo_nick:
        return jsonify({"error": "El NickHabbo es obligatorio"}), 400

    jugador = Jugador.query.get(id)

    if not jugador:
        return jsonify({"error": "Jugador no encontrado"}), 404

    if Jugador.query.filter_by(nickhabbo=nuevo_nick).one_or_none():
        return jsonify({"error": "El NickHabbo ya está en uso"}), 400

    jugador.nickhabbo = nuevo_nick

    try:
        db.session.commit()
        return jsonify({"message": "NickHabbo actualizado correctamente"}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {err.args}"}), 500
    
@api.route('/jugadores/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_jugador(id):
    usuario_actual_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado
    admin = Jugador.query.get(usuario_actual_id)  # Verifica si es administrador

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso no autorizado"}), 403

    jugador = Jugador.query.get(id)

    if not jugador:
        return jsonify({"error": "Jugador no encontrado"}), 404

    try:
        db.session.delete(jugador)
        db.session.commit()
        return jsonify({"message": "Jugador eliminado correctamente"}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {err.args}"}), 500


@api.route('/login', methods=['POST'])
def login():
    try:
        body = request.json
        email = body.get("email")
        password = body.get("password")

        if not email or not password:
            return jsonify({"message": "Debes ingresar un email y una contraseña."}), 400

        user = Jugador.query.filter_by(email=email).one_or_none()

        if not user:
            return jsonify({"message": "Correo o contraseña incorrectos."}), 401  # Cambiado a 401

        if not user.is_active:
            return jsonify({"message": "Tu cuenta ha sido deshabilitada. Contacta al administrador."}), 403

        if check_password_hash(user.password, f"{password}{user.salt}"):
            token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
            return jsonify({"token": token, "role": user.role}), 200  
        else:
            return jsonify({"message": "Correo o contraseña incorrectos."}), 401  # Cambiado a 401

    except Exception as err:
        return jsonify({"error": str(err)}), 500
    

@api.route('/asistencia', methods=['POST'])
def registrar_asistencia():
    data = request.get_json()
    nombre = data.get("nombre", "").strip()

    if not nombre:
        return jsonify({"message": "El nombre es obligatorio"}), 400

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)  # Captura la IP del usuario

    nueva_asistencia = Asistencia(nombre=nombre, ip=ip)
    db.session.add(nueva_asistencia)
    db.session.commit()

    return jsonify({"message": "Asistencia registrada correctamente"}), 201

    

@api.route('/asistencia', methods=['GET'])
@jwt_required(optional=True) 
def obtener_asistencias():
    """Devuelve todas las asistencias registradas. Solo los admins ven la IP."""
    claims = get_jwt_identity()  # Obtiene el usuario actual si está logueado
    es_admin = False

    if claims:
        usuario = Jugador.query.get(claims)
        es_admin = usuario and usuario.role == "admin"
        

    asistencias = Asistencia.query.all()
    return jsonify([asistencia.serialize(admin=es_admin) for asistencia in asistencias])

@api.route('/torneos', methods=['POST'])
def crear_torneo():
    data = request.json

    # Validaciones
    if not data.get("nombre") or not data.get("modalidad") or not data.get("formato"):
        return jsonify({"error": "Nombre, modalidad y formato son obligatorios"}), 400

    formatos_validos = ["liga", "eliminacion", "grupos_playoffs"]
    if data["formato"] not in formatos_validos:
        return jsonify({"error": "Formato inválido"}), 400

    # Verificar si el torneo ya existe
    if Torneo.query.filter_by(nombre=data["nombre"]).first():
        return jsonify({"error": "El torneo ya existe"}), 409

    # Crear el torneo
    nuevo_torneo = Torneo(nombre=data["nombre"], modalidad=data["modalidad"], formato=data["formato"])
    db.session.add(nuevo_torneo)
    db.session.commit()

    return jsonify({
        "message": "Torneo creado exitosamente",
        "torneo": {
            "id": nuevo_torneo.id,
            "nombre": nuevo_torneo.nombre,
            "modalidad": nuevo_torneo.modalidad,
            "formato": nuevo_torneo.formato
        }
    }), 201

@api.route('/torneos', methods=['GET'])
def obtener_torneos():
    try:
        torneos = Torneo.query.all()
        torneos_json = [
            {
                "id": torneo.id,
                "nombre": torneo.nombre,
                "modalidad": torneo.modalidad,
                "formato": torneo.formato
            } 
            for torneo in torneos
        ]
        return jsonify(torneos_json), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener los torneos", "detalle": str(e)}), 500


@api.route('/equipos', methods=['POST'])
def crear_equipo():
    nombre = request.form.get("nombre")
    torneo_id = request.form.get("torneo_id")

    if not nombre or not torneo_id:
        return jsonify({"error": "El nombre y el torneo son obligatorios"}), 400

    try:
        torneo_id = int(torneo_id)
    except ValueError:
        return jsonify({"error": "El torneo_id debe ser un número entero"}), 400

    # Procesar logo si existe
    logo = request.files.get("logo")
    logo_url = None
    if logo:
        try:
            result = upload(logo)
            logo_url = result["secure_url"]
        except Exception as e:
            return jsonify({"error": f"Error al subir la imagen: {str(e)}"}), 500

    # Guardar en la base de datos
    try:
        nuevo_equipo = Equipo(nombre=nombre, torneo_id=torneo_id, logo_url=logo_url)
        db.session.add(nuevo_equipo)
        db.session.commit()
        return jsonify({"message": "Equipo creado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": f"Error al guardar en la BD: {str(e)}"}), 500





@api.route('/equipos', methods=['GET'])
def obtener_equipos():
    equipos = Equipo.query.all()
    
    equipos_serializados = [
        {"id": equipo.id, "nombre": equipo.nombre, "torneo_id": equipo.torneo_id, "modalidad": equipo.torneo.modalidad if equipo.torneo else "Desconocida"}
        for equipo in equipos
    ]
    
    return jsonify(equipos_serializados), 200


@api.route('/equipos-con-logo', methods=['GET'])
def obtener_equipos_con_logo():
    equipos = Equipo.query.all()
    
    equipos_serializados = [
        {
            "id": equipo.id,
            "nombre": equipo.nombre,
            "torneo_id": equipo.torneo_id,
            "modalidad": equipo.torneo.modalidad if equipo.torneo else "Desconocida",
            "logo_url": equipo.logo_url  # ✅ Aquí incluimos la imagen
        }
        for equipo in equipos
    ]
    
    return jsonify(equipos_serializados), 200
    

@api.route('/equipos/<int:equipo_id>', methods=['DELETE'])
def eliminar_equipo(equipo_id):
    equipo = Equipo.query.get(equipo_id)
    
    if not equipo:
        return jsonify({"message": "Equipo no encontrado"}), 404

    db.session.delete(equipo)
    db.session.commit()

    return jsonify({"message": "Equipo eliminado correctamente"}), 200



@api.route('/torneos/<int:torneo_id>', methods=['DELETE'])
@jwt_required()
def eliminar_torneo(torneo_id):
    torneo = Torneo.query.get(torneo_id)

    if not torneo:
        return jsonify({"message": "Torneo no encontrado"}), 404

    try:
        db.session.delete(torneo)
        db.session.commit()
        return jsonify({"message": "Torneo eliminado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al eliminar el torneo", "error": str(e)}), 500
    



@api.route('/partidos', methods=['POST'])
@jwt_required()
def registrar_partido():
    """Registrar un partido (Solo Admins o Árbitros)"""
    try:
        current_user_id = get_jwt_identity()
        usuario = Jugador.query.get(current_user_id)

        # 🔥 Validar que el usuario sea admin o árbitro
        if not usuario or usuario.role not in ["admin", "arbitro"]:
            return jsonify({"error": "Acceso denegado. Solo administradores y árbitros pueden registrar partidos."}), 403

        # 📌 Obtener los datos del partido
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos en la solicitud"}), 400

        # 🔍 Verificar que los campos requeridos estén presentes
        required_fields = [
            "torneo_id", "equipo_a_id", "equipo_b_id", "juez",
            "goles_equipo_a", "goles_equipo_b",
            "mvp_id", "mencion_equipo_a_id", "mencion_equipo_b_id"
        ]
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

        # 📌 Obtener torneo para incluir la modalidad
        torneo = Torneo.query.get(data["torneo_id"])
        if not torneo:
            return jsonify({"error": "El torneo seleccionado no existe"}), 404

        # ✅ Crear el partido
        nuevo_partido = Partido(
            torneo_id=int(data["torneo_id"]),
            equipo_a_id=int(data["equipo_a_id"]),
            equipo_b_id=int(data["equipo_b_id"]),
            juez=data["juez"],
            goles_equipo_a=int(data["goles_equipo_a"]),
            goles_equipo_b=int(data["goles_equipo_b"]),
            mvp_id=int(data["mvp_id"]),
            mencion_equipo_a_id=int(data["mencion_equipo_a_id"]),
            mencion_equipo_b_id=int(data["mencion_equipo_b_id"]),
            link_video=data.get("link_video"),
            observaciones=data.get("observaciones")
        )

        db.session.add(nuevo_partido)
        db.session.commit()  # Guardar el partido en la base de datos

        # ✅ Guardar estadísticas si existen
        if "estadisticas" in data and isinstance(data["estadisticas"], list):
            for estadistica in data["estadisticas"]:
                nueva_estadistica = EstadisticaJugador(
                    partido_id=nuevo_partido.id,
                    jugador_id=int(estadistica["jugador_id"]),
                    goles=int(estadistica.get("goles", 0)),
                    asistencias=int(estadistica.get("asistencias", 0)),
                    autogoles=int(estadistica.get("autogoles", 0))
                )
                db.session.add(nueva_estadistica)

        db.session.commit()  # Guardar estadísticas en la base de datos

        # ✅ Respuesta con los datos del partido registrado
        return jsonify({
            "message": "Partido registrado correctamente",
            "partido": {
                "id": nuevo_partido.id,
                "torneo_id": nuevo_partido.torneo_id,
                "modalidad": torneo.modalidad,
                "equipo_a_id": nuevo_partido.equipo_a_id,
                "equipo_b_id": nuevo_partido.equipo_b_id,
                "estado": nuevo_partido.estado,
                "fecha": nuevo_partido.fecha.strftime("%Y-%m-%d %H:%M:%S"),
                "juez": nuevo_partido.juez,
                "goles_equipo_a": nuevo_partido.goles_equipo_a,
                "goles_equipo_b": nuevo_partido.goles_equipo_b,
                "mvp": nuevo_partido.mvp_id,
                "observaciones": nuevo_partido.observaciones
            }
        }), 201

    except Exception as e:
        db.session.rollback()  # Revertir cambios en caso de error
        return jsonify({"error": "Error interno en el servidor", "detalle": str(e)}), 500




@api.route('/equipos/torneo/<int:torneo_id>', methods=['GET'])
def obtener_equipos_por_torneo(torneo_id):
    try:
        equipos = Equipo.query.filter_by(torneo_id=torneo_id).all()
        equipos_json = [
            {
                "id": equipo.id,
                "nombre": equipo.nombre
            }
            for equipo in equipos
        ]
        return jsonify(equipos_json), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener los equipos", "detalle": str(e)}), 500
    
@api.route('/partidos', methods=['GET'])
def obtener_partidos():
    try:
        partidos = Partido.query.all()
        partidos_json = []

        for partido in partidos:
            estadisticas_json = []
            
            for estadistica in partido.estadisticas:
                # ⚠️ Obtener el jugador directamente de la estadística
                jugador_id = estadistica.jugador_id
                
                # ⚠️ Buscar el equipo en jugadores_equipos
                equipo_id = db.session.query(JugadorEquipo.equipo_id).filter(
                    JugadorEquipo.jugador_id == jugador_id,
                    JugadorEquipo.equipo_id.in_([partido.equipo_a_id, partido.equipo_b_id])
                ).scalar()

                # ⚠️ Imprimir para depuración
                print(f"🔍 Jugador ID: {jugador_id}, Equipo ID: {equipo_id}")

                estadisticas_json.append({
                    "jugador_id": jugador_id,
                    "equipo_id": equipo_id,  # ✅ Ahora obtenemos correctamente el equipo del jugador
                    "goles": estadistica.goles,
                    "asistencias": estadistica.asistencias,
                    "autogoles": estadistica.autogoles
                })

            partidos_json.append({
                "id": partido.id,
                "torneo_id": partido.torneo_id,
                "equipo_a_id": partido.equipo_a_id,
                "equipo_b_id": partido.equipo_b_id,
                "fecha": partido.fecha.strftime("%Y-%m-%d %H:%M:%S"),
                "estado": partido.estado,
                "juez": partido.juez,
                "goles_equipo_a": partido.goles_equipo_a,
                "goles_equipo_b": partido.goles_equipo_b,
                "mvp_id": partido.mvp_id,
                "mencion_equipo_a_id": partido.mencion_equipo_a_id,
                "mencion_equipo_b_id": partido.mencion_equipo_b_id,
                "observaciones": partido.observaciones,
                "modalidad": partido.torneo.modalidad if partido.torneo else None,
                "link_video": partido.link_video,
                "estadisticas": estadisticas_json  # ✅ Ahora incluye el equipo_id correcto
            })

        return jsonify(partidos_json), 200
    except Exception as e:
        print(f"⚠️ Error en obtener_partidos: {str(e)}")  # 🔍 DEPURAR ERROR
        return jsonify({"error": "Error al obtener los partidos", "detalle": str(e)}), 500







    

@api.route('/admin/players/<int:jugador_id>/remove-team/<int:equipo_id>', methods=['PUT'])
@jwt_required()
def remove_team_from_player(jugador_id, equipo_id):
    """Permite al administrador quitar a un jugador de un equipo específico"""
    current_user_id = get_jwt_identity()
    admin = Jugador.query.get(current_user_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso denegado"}), 403

    jugador = Jugador.query.get(jugador_id)
    equipo = Equipo.query.get(equipo_id)

    if not jugador or not equipo:
        return jsonify({"error": "Jugador o equipo no encontrado"}), 404

    # Verifica si el jugador pertenece al equipo
    if jugador.equipo_id != equipo.id:
        return jsonify({"error": "El jugador no pertenece a este equipo"}), 400

    # Eliminar la relación del jugador con el equipo
    jugador.equipo_id = None

    try:
        db.session.commit()
        return jsonify({"message": f"Jugador {jugador.nickhabbo} eliminado del equipo {equipo.nombre}"}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {str(err)}"}), 500


@api.route('/tablas/posiciones/<int:torneo_id>', methods=['GET'])
def obtener_tabla_posiciones(torneo_id):
    try:
        torneo = Torneo.query.get(torneo_id)
        if not torneo:
            return jsonify({"error": "Torneo no encontrado"}), 404

        equipos = Equipo.query.filter_by(torneo_id=torneo_id).all()
        tabla = []

        for equipo in equipos:
            partidos_jugados = Partido.query.filter(
                (Partido.equipo_a_id == equipo.id) | (Partido.equipo_b_id == equipo.id)
            ).all()

            puntos = 0
            partidos_ganados = 0
            partidos_empatados = 0
            partidos_perdidos = 0
            goles_favor = 0
            goles_contra = 0
            partidos_totales = 0  # 🔥 Contador de partidos jugados

            for partido in partidos_jugados:
                if partido.estado != "finalizado":
                    continue  # Solo contar partidos terminados

                partidos_totales += 1  # 🔥 Incrementamos los partidos jugados

                if partido.equipo_a_id == equipo.id:
                    goles_favor += partido.goles_equipo_a
                    goles_contra += partido.goles_equipo_b
                    if partido.goles_equipo_a > partido.goles_equipo_b:
                        partidos_ganados += 1
                        puntos += 3
                    elif partido.goles_equipo_a == partido.goles_equipo_b:
                        partidos_empatados += 1
                        puntos += 1
                    else:
                        partidos_perdidos += 1

                elif partido.equipo_b_id == equipo.id:
                    goles_favor += partido.goles_equipo_b
                    goles_contra += partido.goles_equipo_a
                    if partido.goles_equipo_b > partido.goles_equipo_a:
                        partidos_ganados += 1
                        puntos += 3
                    elif partido.goles_equipo_b == partido.goles_equipo_a:
                        partidos_empatados += 1
                        puntos += 1
                    else:
                        partidos_perdidos += 1

            tabla.append({
                "equipo": equipo.nombre,
                "puntos": puntos,
                "partidos_jugados": partidos_totales,  # ✅ Ahora sí enviamos los partidos jugados
                "ganados": partidos_ganados,
                "empatados": partidos_empatados,
                "perdidos": partidos_perdidos,
                "goles_favor": goles_favor,
                "goles_contra": goles_contra,
                "diferencia_goles": goles_favor - goles_contra
            })

        tabla_ordenada = sorted(tabla, key=lambda x: (-x["puntos"], -x["diferencia_goles"]))

        return jsonify(tabla_ordenada), 200

    except Exception as e:
        print(f"❌ Error en obtener_tabla_posiciones: {str(e)}")
        return jsonify({"error": "Error en el servidor", "detalle": str(e)}), 500






@api.route('/tablas/goleadores/<int:torneo_id>', methods=['GET'])
def obtener_goleadores_por_torneo(torneo_id):
    """Obtener tabla de goleadores de un torneo específico"""
    jugadores = db.session.query(
        Jugador.id, Jugador.nickhabbo, db.func.sum(EstadisticaJugador.goles).label("total_goles")
    ).join(EstadisticaJugador).join(Partido).filter(
        Partido.torneo_id == torneo_id  # 🔹 Filtrar por torneo
    ).group_by(Jugador.id).order_by(db.desc("total_goles")).all()

    goleadores = [{"id": j[0], "nickhabbo": j[1], "goles": j[2] or 0} for j in jugadores]  # Evitar valores None

    return jsonify(goleadores), 200



@api.route('/tablas/asistidores/<int:torneo_id>', methods=['GET'])
def obtener_asistidores_por_torneo(torneo_id):
    """Obtener tabla de asistidores de un torneo específico"""
    jugadores = db.session.query(
        Jugador.id, Jugador.nickhabbo, db.func.sum(EstadisticaJugador.asistencias).label("total_asistencias")
    ).join(EstadisticaJugador).join(Partido).filter(
        Partido.torneo_id == torneo_id  # 🔹 Filtrar por torneo
    ).group_by(Jugador.id).order_by(db.desc("total_asistencias")).all()

    asistidores = [{"id": j[0], "nickhabbo": j[1], "asistencias": j[2] or 0} for j in jugadores]  # Evitar valores None

    return jsonify(asistidores), 200


@api.route('/tablas/mvps', methods=['GET'])
def obtener_mvps():
    """Obtener jugadores con más MVPs"""
    jugadores_mvp = db.session.query(
        Jugador.id, Jugador.nickhabbo, db.func.count(Partido.mvp_id).label("total_mvps")
    ).join(Partido, Jugador.id == Partido.mvp_id).group_by(Jugador.id).order_by(db.desc("total_mvps")).all()

    mvps = [{"id": j[0], "nickhabbo": j[1], "mvps": j[2]} for j in jugadores_mvp]

    return jsonify(mvps), 200


@api.route('/tablas/menciones', methods=['GET'])
def obtener_menciones():
    """Obtener jugadores con más menciones especiales"""
    jugadores_mencion = db.session.query(
        Jugador.id, Jugador.nickhabbo, db.func.count().label("total_menciones")
    ).filter(
        (Jugador.id == Partido.mencion_equipo_a_id) | (Jugador.id == Partido.mencion_equipo_b_id)
    ).group_by(Jugador.id).order_by(db.desc("total_menciones")).all()

    menciones = [{"id": j[0], "nickhabbo": j[1], "menciones": j[2]} for j in jugadores_mencion]

    return jsonify(menciones), 200






    
    

