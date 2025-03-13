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

@api.route('/admin/players', methods=['GET'])
@jwt_required()
def get_all_players():
    """Lista todos los jugadores con sus equipos y modalidades (Solo admins)"""
    current_user_id = get_jwt_identity()
    admin = Jugador.query.get(current_user_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso denegado"}), 403

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
    data = request.json

    nombre = data.get("nombre")
    torneo_id = data.get("torneo_id")

    if not nombre or not torneo_id:
        return jsonify({"message": "El nombre y el torneo son obligatorios"}), 400

    # Verificamos si el equipo ya existe
    equipo_existente = Equipo.query.filter_by(nombre=nombre).first()
    if equipo_existente:
        return jsonify({"message": "El equipo ya existe"}), 400

    # Creamos el equipo sin jugadores
    nuevo_equipo = Equipo(nombre=nombre, torneo_id=torneo_id)
    db.session.add(nuevo_equipo)
    db.session.commit()

    return jsonify({
        "message": "Equipo creado exitosamente",
        "equipo": {"id": nuevo_equipo.id, "nombre": nuevo_equipo.nombre}
    }), 201

@api.route('/equipos', methods=['GET'])
def obtener_equipos():
    equipos = Equipo.query.all()
    
    equipos_serializados = [
        {"id": equipo.id, "nombre": equipo.nombre, "torneo_id": equipo.torneo_id, "modalidad": equipo.torneo.modalidad if equipo.torneo else "Desconocida"}
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
    """Registrar un partido con sus estadísticas"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos en la solicitud"}), 400

        # Verificar si algún campo está ausente o vacío
        required_fields = [
            "torneo_id", "equipo_a_id", "equipo_b_id", "juez",
            "goles_equipo_a", "goles_equipo_b",
            "mvp_id", "mencion_equipo_a_id", "mencion_equipo_b_id"
        ]

        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

        # Crear el partido en la base de datos
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
        db.session.commit()

        return jsonify({"message": "Partido registrado correctamente"}), 201

    except Exception as e:
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
        partidos_json = [
            {
                "id": partido.id,
                "torneo_id": partido.torneo_id,
                "equipo_a_id": partido.equipo_a_id,
                "equipo_b_id": partido.equipo_b_id,
                "fecha": partido.fecha.strftime("%Y-%m-%d %H:%M:%S"),
                "estado": partido.estado,
                "juez": partido.juez,
                "goles_equipo_a": partido.goles_equipo_a,
                "goles_equipo_b": partido.goles_equipo_b,
                "link_video": partido.link_video,
                "mvp_id": partido.mvp_id,
                "mencion_equipo_a_id": partido.mencion_equipo_a_id,
                "mencion_equipo_b_id": partido.mencion_equipo_b_id,
                "observaciones": partido.observaciones
            }
            for partido in partidos
        ]
        return jsonify(partidos_json), 200
    except Exception as e:
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

    

    
    

