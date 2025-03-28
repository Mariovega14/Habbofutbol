"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Jugador, Equipo, Torneo, Partido, EstadisticaJugador, Asistencia, JugadorEquipo, Oferta, Convocatoria, Noticia
from api.utils import generate_sitemap, APIException, get_client_ip, is_valid_password 
from flask_cors import CORS
import os
from base64 import b64encode
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
import cloudinary.uploader
from cloudinary.uploader import upload
from datetime import datetime, timedelta
from extensions import limiter
from auth import token_required

api = Blueprint('api', __name__)

# Allow CORS requests to this API

@api.route('/sitemap', methods=['GET'])
@jwt_required()  # Asegura que solo los usuarios autenticados pueden acceder
def sitemap():
    # Obtener el usuario actual
    current_user = get_jwt_identity()
    
    # Verificar si el usuario es superadmin
    if current_user.get('role') != 'superadmin':
        return jsonify({"message": "Acceso denegado: se necesita el rol de superadmin"}), 403
    
    # Si es superadmin, generamos el sitemap
    return generate_sitemap(app)


@api.route('/register', methods=['POST'])
def add_new_player():
    body = request.json
    required_fields = ["email", "name", "password", "nickhabbo"]

    if not all(body.get(field) for field in required_fields):
        return jsonify({"error": "Todos los datos tienen que estar completos"}), 400

    if not is_valid_password(body["password"]):
        return jsonify({
            "error": "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número."
        }), 400

    email, name, password, nickhabbo = [body[field] for field in required_fields]

    if Jugador.query.filter_by(email=email).one_or_none():
        return jsonify({"error": "El jugador ya está registrado"}), 400

    salt = b64encode(os.urandom(32)).decode("utf-8")
    hashed_password = generate_password_hash(f"{password}{salt}")

    new_player = Jugador(
        name=name, email=email, password=hashed_password, salt=salt,
        nickhabbo=nickhabbo, role="jugador", is_active=True, is_registered=True
    )

    try:
        db.session.add(new_player)
        db.session.commit()
        return jsonify({"message": "Jugador registrado satisfactoriamente"}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {err.args}"}), 500


@api.route('/jugadores/noregistrados', methods=['POST'])
@jwt_required()
@token_required
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


    
@api.route('/players/add_team', methods=['POST'])
@jwt_required()
@token_required
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
@jwt_required()
@token_required
def remove_team():
    """Solo los Admins pueden eliminar jugadores de un equipo"""
    try:
        # 🔍 Obtener el rol del usuario autenticado
        jwt_data = get_jwt()
        user_role = jwt_data.get("role")

        # 🚫 Solo los admins pueden hacer esto
        if user_role != "admin":
            return jsonify({"error": "Acceso denegado"}), 403

        # 📌 Obtener datos de la petición
        data = request.json
        player_id = data.get("player_id")
        team_id = data.get("team_id")

        if not player_id or not team_id:
            return jsonify({"error": "Datos incompletos"}), 400

        # 🔍 Buscar la relación en la tabla intermedia
        jugador_equipo = JugadorEquipo.query.filter_by(jugador_id=player_id, equipo_id=team_id).first()

        if not jugador_equipo:
            return jsonify({"error": "El jugador no pertenece a este equipo"}), 404

        # 🗑 Eliminar la relación de la tabla intermedia
        db.session.delete(jugador_equipo)
        db.session.commit()

        return jsonify({"message": "Jugador eliminado del equipo correctamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500
 


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
@token_required
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
            return jsonify({"token": token, "role": user.role, "id": user.id}), 200 
        else:
            return jsonify({"message": "Correo o contraseña incorrectos."}), 401  # Cambiado a 401

    except Exception as err:
        return jsonify({"error": str(err)}), 500
    


# Endpoint protegido
@api.route('/asistencia', methods=['POST'])
@limiter.limit("3 per minute")  # Solo permite 3 intentos por IP por minuto
def registrar_asistencia():
    data = request.get_json()
    nombre = data.get("nombre", "").strip()

    if not nombre:
        return jsonify({"message": "El nombre es obligatorio"}), 400

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Bloquear si ya registró con el mismo nombre en el último minuto
    hace_un_minuto = datetime.utcnow() - timedelta(minutes=1)
    repetido = Asistencia.query.filter_by(nombre=nombre).filter(Asistencia.fecha_hora >= hace_un_minuto).first()
    if repetido:
        return jsonify({"message": "Ya registraste asistencia recientemente"}), 429

    nueva_asistencia = Asistencia(nombre=nombre, ip=ip)
    db.session.add(nueva_asistencia)
    db.session.commit()

    return jsonify({"message": "Asistencia registrada correctamente"}), 201


    

@api.route('/asistencia', methods=['GET'])
def obtener_asistencias():
    """Devuelve todas las asistencias registradas. Solo los admins ven la IP."""
    es_admin = False

    try:
        if verify_jwt_in_request(optional=True):  
            claims = get_jwt_identity()
            usuario = Jugador.query.get(claims)
            es_admin = usuario and usuario.role == "admin"
    except:
        pass  # Si no hay token, simplemente seguimos sin admin

    asistencias = Asistencia.query.all()
    return jsonify([asistencia.serialize(admin=es_admin) for asistencia in asistencias])

@api.route('/torneos', methods=['POST'])
@jwt_required()
@token_required
def crear_torneo():
    """Solo los Admins pueden crear torneos"""
    try:
        # 🔍 Obtener el rol del usuario autenticado
        jwt_data = get_jwt()
        user_role = jwt_data.get("role")

        # 🚫 Solo los admins pueden crear torneos
        if user_role != "admin":
            return jsonify({"error": "Acceso denegado"}), 403

        # 📌 Obtener datos de la petición
        data = request.json

        # 🛑 Validaciones
        if not data.get("nombre") or not data.get("modalidad") or not data.get("formato"):
            return jsonify({"error": "Nombre, modalidad y formato son obligatorios"}), 400

        formatos_validos = ["liga", "eliminacion", "grupos_playoffs"]
        if data["formato"] not in formatos_validos:
            return jsonify({"error": "Formato inválido"}), 400

        # 🔍 Verificar si el torneo ya existe
        if Torneo.query.filter_by(nombre=data["nombre"]).first():
            return jsonify({"error": "El torneo ya existe"}), 409

        # 🏆 Crear el torneo
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

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

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
@jwt_required()
@token_required
def crear_equipo():
    """Solo los Admins pueden crear equipos"""
    try:
        # 🔍 Obtener el rol del usuario autenticado
        jwt_data = get_jwt()
        user_role = jwt_data.get("role")

        # 🚫 Solo los admins pueden crear equipos
        if user_role != "admin":
            return jsonify({"error": "Acceso denegado"}), 403

        # 📌 Obtener datos de la petición
        nombre = request.form.get("nombre")
        torneo_id = request.form.get("torneo_id")

        if not nombre or not torneo_id:
            return jsonify({"error": "El nombre y el torneo son obligatorios"}), 400

        try:
            torneo_id = int(torneo_id)
        except ValueError:
            return jsonify({"error": "El torneo_id debe ser un número entero"}), 400

        # 📌 Procesar logo si existe
        logo = request.files.get("logo")
        logo_url = None
        if logo:
            try:
                result = upload(logo)
                logo_url = result["secure_url"]
            except Exception as e:
                return jsonify({"error": f"Error al subir la imagen: {str(e)}"}), 500

        # 🏆 Guardar equipo en la base de datos
        nuevo_equipo = Equipo(nombre=nombre, torneo_id=torneo_id, logo_url=logo_url)
        db.session.add(nuevo_equipo)
        db.session.commit()

        return jsonify({"message": "Equipo creado exitosamente"}), 201

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500





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
@jwt_required()
@token_required
def eliminar_equipo(equipo_id):
    """Solo los Admins pueden eliminar equipos"""
    try:
        # 🔍 Obtener el rol del usuario autenticado
        jwt_data = get_jwt()
        user_role = jwt_data.get("role")

        # 🚫 Solo los admins pueden eliminar equipos
        if user_role != "admin":
            return jsonify({"error": "Acceso denegado"}), 403

        # 📌 Buscar el equipo en la base de datos
        equipo = Equipo.query.get(equipo_id)
        if not equipo:
            return jsonify({"message": "Equipo no encontrado"}), 404

        db.session.delete(equipo)
        db.session.commit()

        return jsonify({"message": "Equipo eliminado correctamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


@api.route('/torneos/<int:torneo_id>', methods=['DELETE'])
@jwt_required()
@token_required
def eliminar_torneo(torneo_id):
    """Solo los Admins pueden eliminar torneos"""
    try:
        # 🔍 Obtener el rol del usuario autenticado
        jwt_data = get_jwt()
        user_role = jwt_data.get("role")

        # 🚫 Solo los admins pueden eliminar torneos
        if user_role != "admin":
            return jsonify({"error": "Acceso denegado"}), 403

        # 📌 Buscar el torneo en la base de datos
        torneo = Torneo.query.get(torneo_id)
        if not torneo:
            return jsonify({"message": "Torneo no encontrado"}), 404

        db.session.delete(torneo)
        db.session.commit()

        return jsonify({"message": "Torneo eliminado exitosamente"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al eliminar el torneo", "error": str(e)}), 500
    



@api.route('/partidos', methods=['POST'])
@jwt_required()
@token_required
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
        partidos = Partido.query.order_by(Partido.fecha.desc()).all()
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
                "estadisticas": estadisticas_json  
            })

        return jsonify(partidos_json), 200
    except Exception as e:
        print(f"⚠️ Error en obtener_partidos: {str(e)}") 
        return jsonify({"error": "Error al obtener los partidos", "detalle": str(e)}), 500







    

@api.route('/players/<int:jugador_id>/remove-team/<int:equipo_id>', methods=['PUT'])
@jwt_required()
@token_required
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


@api.route("/jugador/crear_convocatoria", methods=["POST"])
@token_required
def crear_convocatoria():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Datos no proporcionados"}), 400

    jugador_id = data.get("jugador_id")
    modalidad = data.get("modalidad")

    # Verificar si ya existe una convocatoria para esta modalidad
    convocatoria_existente = Convocatoria.query.filter_by(jugador_id=jugador_id, modalidad=modalidad).first()
    if convocatoria_existente:
        return jsonify({"error": "Ya tienes una convocatoria activa en esta modalidad"}), 400

    # Crear nueva convocatoria
    nueva_convocatoria = Convocatoria(
        jugador_id=jugador_id,
        mensaje=data.get("mensaje"),
        modalidad=modalidad
    )

    db.session.add(nueva_convocatoria)
    db.session.commit()

    return jsonify({"mensaje": "Convocatoria creada con éxito"}), 201


@api.route("/convocatorias/<string:modalidad>", methods=["GET"])
@token_required
def obtener_convocatorias(modalidad):
    convocatorias = db.session.query(
        Convocatoria.id,
        Convocatoria.jugador_id,
        Convocatoria.mensaje,
        Convocatoria.modalidad,
        Jugador.nickhabbo
    ).join(Jugador, Jugador.id == Convocatoria.jugador_id).filter(Convocatoria.modalidad == modalidad).all()

    resultado = [
        {
            "id": c.id,
            "jugador_id": c.jugador_id,
            "mensaje": c.mensaje,
            "modalidad": c.modalidad,
            "nickhabbo": c.nickhabbo
        } for c in convocatorias
    ]

    return jsonify(resultado), 200


@api.route("/dt/ofertar", methods=["POST"])
def ofertar_jugador():
    try:
        data = request.json

        dt_id = data.get("dt_id")
        jugador_id = data.get("jugador_id")
        equipo_id = data.get("equipo_id")

        # Validar que sean números
        if not dt_id or not jugador_id or not equipo_id:
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        try:
            dt_id = int(dt_id)
            jugador_id = int(jugador_id)
            equipo_id = int(equipo_id)
        except ValueError:
            return jsonify({"error": "ID inválidos, deben ser números enteros"}), 400

        dt = Jugador.query.get(dt_id)
        jugador = Jugador.query.get(jugador_id)
        equipo = Equipo.query.get(equipo_id)

        if not dt or not jugador or not equipo:
            return jsonify({"error": "Datos inválidos"}), 400

        if dt.role != "dt":
            return jsonify({"error": "Solo un DT puede hacer ofertas"}), 403

        nueva_oferta = Oferta(dt_id=dt_id, jugador_id=jugador_id, equipo_id=equipo_id)
        db.session.add(nueva_oferta)
        db.session.commit()

        return jsonify({"message": f"Oferta enviada a {jugador.nickhabbo} para {equipo.nombre}."})

    except Exception as err:
        return jsonify({"error": "Error interno del servidor"}), 500




@api.route("/jugador/<int:jugador_id>/ofertas/<string:modalidad>", methods=["GET"])
def ver_ofertas_por_modalidad(jugador_id, modalidad):
    modalidad = modalidad.upper()  # Normalizar modalidad

    # Verificar si el jugador tiene convocatorias en esa modalidad
    existe_convocatoria = Convocatoria.query.filter_by(jugador_id=jugador_id, modalidad=modalidad).first()
    if not existe_convocatoria:
        return jsonify({"error": f"No se encontraron convocatorias en la modalidad {modalidad} para este jugador"}), 404

    # Filtrar ofertas directamente en la consulta SQLAlchemy
    ofertas = Oferta.query.join(Equipo).join(Torneo).filter(
        Oferta.jugador_id == jugador_id,
        Torneo.modalidad == modalidad
    ).all()

    resultados = [{
        "id": o.id,
        "dt_id": o.dt_id,
        "equipo_id": o.equipo_id,
        "equipo_nombre": o.equipo.nombre,
        "dt_nombre": o.dt.nickhabbo,
        "modalidad": o.equipo.torneo.modalidad
    } for o in ofertas]

    return jsonify(resultados)


@api.route("/jugador/aceptar_oferta", methods=["POST"])
def aceptar_oferta():
    try:
        data = request.json
        oferta_id = data.get("oferta_id")

        if not oferta_id:
            return jsonify({"error": "Falta el ID de la oferta"}), 400

        oferta = Oferta.query.get(oferta_id)
        if not oferta:
            return jsonify({"error": "Oferta no encontrada"}), 404

        modalidad = oferta.equipo.torneo.modalidad.upper()

        existe_equipo = JugadorEquipo.query.filter_by(
            jugador_id=oferta.jugador_id, 
            modalidad=modalidad
        ).first()
        
        if existe_equipo:
            return jsonify({"error": "Este jugador ya tiene equipo en esta modalidad"}), 400

        nuevo_registro = JugadorEquipo(
            jugador_id=oferta.jugador_id, 
            equipo_id=oferta.equipo_id, 
            modalidad=modalidad
        )
        db.session.add(nuevo_registro)

        Convocatoria.query.filter_by(jugador_id=oferta.jugador_id, modalidad=modalidad).delete(synchronize_session=False)

        Oferta.query.filter(
            Oferta.jugador_id == oferta.jugador_id,
            Oferta.equipo_id.in_(
                db.session.query(Equipo.id)
                .join(Torneo)
                .filter(Torneo.modalidad == modalidad)
            )
        ).delete(synchronize_session=False)

        db.session.commit()
        return jsonify({"message": "Oferta aceptada. El jugador ha sido agregado al equipo y sus convocatorias eliminadas."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500

@api.route("/jugador/eliminar_convocatoria/<int:convocatoria_id>", methods=["DELETE"])
def eliminar_convocatoria(convocatoria_id):
    convocatoria = Convocatoria.query.get(convocatoria_id)

    if not convocatoria:
        return jsonify({"error": "Convocatoria no encontrada"}), 404

    db.session.delete(convocatoria)
    db.session.commit()

    return jsonify({"mensaje": "Convocatoria eliminada con éxito"}), 200        


@api.route("/equipos/dt/<int:dt_id>", methods=["GET"])
@jwt_required()  # Asegura que el DT esté autenticado
def get_equipos_por_dt(dt_id):
    try:
        # Verificar si el jugador con el ID proporcionado es un DT
        dt = Jugador.query.get(dt_id)
        if not dt or dt.role != "dt":
            return jsonify({"mensaje": "No se encontró un DT con ese ID"}), 404
        
        # Obtener los equipos asociados al DT
        equipos = Equipo.query.join(JugadorEquipo).filter(JugadorEquipo.jugador_id == dt_id).all()

        if not equipos:
            return jsonify({"mensaje": "No se encontraron equipos para este DT"}), 404

        # Serializar los equipos
        equipos_serializados = [{"id": equipo.id, "nombre": equipo.nombre} for equipo in equipos]
        
        return jsonify(equipos_serializados), 200
    
    except Exception as e:
        return jsonify({"mensaje": "Error al obtener equipos"}), 500
    


@api.route("/jugadores/rol", methods=["PUT"])
@jwt_required()
def gestionar_rol():
    """Permite a Superadmin cambiar roles de Admins y a Admins asignar roles a Jugadores, Árbitros y DTs"""

    try:
        jwt_data = get_jwt()  # 🔹 Obtener datos del token
        user_role = jwt_data.get("role")  
        usuario_actual_id = get_jwt_identity()

        usuario_actual = Jugador.query.get(usuario_actual_id)
        if not usuario_actual:
            return jsonify({"error": "Usuario no encontrado"}), 404

        # 📌 Obtener datos de la petición
        data = request.get_json()
        player_id = data.get("id")
        new_role = data.get("role")

        if not player_id or not new_role:
            return jsonify({"error": "Faltan datos"}), 400

        # 📌 Buscar al jugador en la base de datos
        player = Jugador.query.get(player_id)
        if not player:
            return jsonify({"error": "Jugador no encontrado"}), 404

        # 🔴 No se puede modificar al Superadmin
        if player.role == "superadmin":
            return jsonify({"error": "No puedes modificar al Superadmin"}), 403

        # 🔴 Validar qué roles puede asignar cada uno
        if user_role == "superadmin":
            if new_role not in ["admin", "jugador", "dt", "arbitro"]:
                return jsonify({"error": "Rol inválido"}), 400
        elif user_role == "admin":
            if new_role not in ["jugador", "dt", "arbitro"]:
                return jsonify({"error": "No puedes asignar este rol"}), 403
        else:
            return jsonify({"error": "No tienes permisos para cambiar roles"}), 403

        # 📌 Asignar nuevo rol
        player.role = new_role
        db.session.commit()

        return jsonify({"mensaje": f"Rol de {player.nickhabbo} actualizado a {new_role}"}), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


@api.route('/jugadores/roles', methods=['GET'])
@jwt_required()
def get_players_roles():
    """Lista todos los jugadores con sus IDs, nicks y roles (Solo Admins y Superadmin)"""

    try:
        user_id = get_jwt_identity()
        user = Jugador.query.get(user_id)

        # 🔴 Solo Admin o Superadmin pueden acceder
        if not user or user.role not in ["admin", "superadmin"]:
            return jsonify({"error": "Acceso denegado"}), 403  

        players = Jugador.query.with_entities(Jugador.id, Jugador.nickhabbo, Jugador.role).all()
        players_list = [{"id": p.id, "nickhabbo": p.nickhabbo, "role": p.role} for p in players]

        return jsonify(players_list), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


@api.route('/noticias', methods=['POST'])
@jwt_required()
def crear_noticia():
    """Crear una nueva noticia con imagen opcional."""
    try:
        # 📌 Obtener datos de la petición
        titulo = request.form.get("titulo")
        contenido = request.form.get("contenido")

        if not titulo or not contenido:
            return jsonify({"error": "Faltan datos"}), 400

        # 📌 Procesar imagen si existe
        imagen = request.files.get("imagen")
        imagen_url = None
        if imagen:
            try:
                result = upload(imagen)  # Sube la imagen a Cloudinary
                imagen_url = result["secure_url"]
            except Exception as e:
                return jsonify({"error": f"Error al subir la imagen: {str(e)}"}), 500

        # 📰 Guardar noticia en la base de datos
        nueva_noticia = Noticia(titulo=titulo, contenido=contenido, imagen_url=imagen_url)
        db.session.add(nueva_noticia)
        db.session.commit()

        return jsonify({"message": "Noticia creada exitosamente", "imagen_url": imagen_url}), 201

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


    
@api.route('/noticias', methods=['GET'])
def obtener_noticias():
    """Obtener todas las noticias ordenadas por fecha (más recientes primero)"""
    noticias = Noticia.query.order_by(Noticia.fecha_publicacion.desc()).all()


    lista_noticias = [
        {
            "id": n.id,
            "titulo": n.titulo,
            "contenido": n.contenido,
            "imagen_url": n.imagen_url,
            "fecha_publicacion": n.fecha_publicacion.strftime("%Y-%m-%d %H:%M:%S")
        }
        for n in noticias
    ]

    return jsonify(lista_noticias), 200    

@api.route('/noticias/<int:noticia_id>', methods=['PUT'])
@jwt_required()  
def editar_noticia(noticia_id):
    """Editar una noticia existente"""
    data = request.get_json()
    noticia = Noticia.query.get(noticia_id)

    if not noticia:
        return jsonify({"error": "Noticia no encontrada"}), 404


    noticia.titulo = data.get("titulo", noticia.titulo)
    noticia.contenido = data.get("contenido", noticia.contenido)
    noticia.imagen_url = data.get("imagen_url", noticia.imagen_url)

    db.session.commit()

    return jsonify({"message": "Noticia actualizada exitosamente"}), 200


@api.route('/noticias/<int:noticia_id>', methods=['DELETE'])
@jwt_required()  
def eliminar_noticia(noticia_id):
    """Eliminar una noticia"""
    noticia = Noticia.query.get(noticia_id)

    if not noticia:
        return jsonify({"error": "Noticia no encontrada"}), 404

    

    db.session.delete(noticia)
    db.session.commit()

    return jsonify({"message": "Noticia eliminada exitosamente"}), 200
