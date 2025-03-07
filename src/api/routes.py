"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Jugador, Equipo, Torneo, Partido, Estadistica, Asistencia 
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
    """Lista todos los jugadores (Solo admins)"""
    current_user_id = get_jwt_identity()
    admin = Jugador.query.get(current_user_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Acceso denegado"}), 403

    players = Jugador.query.all()
    return jsonify([{"id": p.id, "name": p.name, "nickhabbo": p.nickhabbo} for p in players]), 200

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
    """Registra la asistencia de un jugador con su nombre y la IP del dispositivo."""
    try:
        body = request.json
        nombre = body.get("nombre", "").strip()

        if not nombre:
            return jsonify({"message": "El nombre es obligatorio"}), 400

        ip_usuario = get_client_ip()

        nueva_asistencia = Asistencia(
            nombre=nombre,
            ip=ip_usuario
        )
        db.session.add(nueva_asistencia)
        db.session.commit()

        return jsonify({
            "message": "Asistencia registrada exitosamente"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api.route('/asistencia', methods=['GET'])
@jwt_required(optional=True)  # No requiere login, pero si hay token, se usa
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
        {"id": equipo.id, "nombre": equipo.nombre, "torneo_id": equipo.torneo_id}
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

@api.route('/equipos/<int:equipo_id>/jugadores', methods=['GET'])
def get_jugadores_por_equipo(equipo_id):
    equipo = Equipo.query.get(equipo_id)
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404

    jugadores = Jugador.query.filter_by(equipo_id=equipo_id).all()
    jugadores_data = [{"id": jugador.id, "nombre": jugador.name} for jugador in jugadores]

    return jsonify(jugadores_data), 200

@api.route('/equipos/<int:equipo_id>/jugadores', methods=['POST'])
def agregar_jugador_a_equipo(equipo_id):
    # Buscar el equipo
    equipo = Equipo.query.get(equipo_id)
    
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404
    
    # Obtener el id del jugador desde el cuerpo de la solicitud
    jugador_id = request.json.get('jugador_id')
    if not jugador_id:
        return jsonify({"error": "El ID del jugador es requerido"}), 400
    
    # Buscar el jugador
    jugador = Jugador.query.get(jugador_id)
    if not jugador:
        return jsonify({"error": "Jugador no encontrado"}), 404

    # Asignar el jugador al equipo
    jugador.equipo_id = equipo_id
    db.session.commit()
    
    return jsonify({"message": "Jugador agregado al equipo exitosamente"}), 200

@api.route('/equipos/<int:equipo_id>/jugadores/<int:jugador_id>', methods=['DELETE'])
def eliminar_jugador_de_equipo(equipo_id, jugador_id):
    # Buscar el equipo
    equipo = Equipo.query.get(equipo_id)
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404
    
    # Buscar el jugador
    jugador = Jugador.query.get(jugador_id)
    if not jugador:
        return jsonify({"error": "Jugador no encontrado"}), 404
    
    
    if jugador.equipo_id != equipo_id:
        return jsonify({"error": "El jugador no pertenece a este equipo"}), 400
    
    
    jugador.equipo_id = None
    db.session.commit()
    
    return jsonify({"message": "Jugador eliminado del equipo exitosamente"}), 200