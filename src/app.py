"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db, Jugador
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from base64 import b64encode

load_dotenv()

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../public/')
app = Flask(__name__)
app.url_map.strict_slashes = False

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://habbofutbol.com", "https://www.habbofutbol.com"]}})

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")  # Change this!
jwt = JWTManager(app)

# add the admin
setup_admin(app)

# add the admin
setup_commands(app)

# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object

@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints

  # Cargar variables de entorno




@app.route('/')
def sitemap():
    # Obtener el token de la cabecera de la solicitud
    token = request.headers.get('Authorization')

    if token:
        try:
            # Verificar el token (ajusta la clave secreta)
            payload = jwt.decode(token, 'tu_clave_secreta', algorithms=["HS256"])

            # Aquí podrías comprobar si el usuario tiene el rol de administrador, por ejemplo
            if payload['role'] == 'admin':
                # Si el token es válido y el rol es admin, permite el acceso
                if ENV == "development":
                    return generate_sitemap(app)
                return send_from_directory(static_file_dir, 'index.html')

            else:
                return jsonify({"message": "Acceso denegado, rol no autorizado"}), 403

        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token inválido"}), 401
    else:
        return jsonify({"message": "Token no proporcionado"}), 403

# any other endpoint will try to serve it like a static file
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response

def crear_superadmin():
    email = os.getenv("SUPERADMIN_EMAIL")
    password = os.getenv("SUPERADMIN_PASSWORD")

    if not email or not password:
        print("⚠️ Faltan variables de entorno para el superadmin")
        return

    print(f"🔍 Buscando superadmin con email: {email}")
    superadmin = Jugador.query.filter_by(role="superadmin").first()

    if superadmin:
        print(f"⚠️ Superadmin ya existe: {superadmin.email}")
        return

    # Generar un salt aleatorio de 8 caracteres
    salt = b64encode(os.urandom(32)).decode("utf-8")

    # Hashear la contraseña con el salt concatenado
    hashed_password = generate_password_hash(f"{password}{salt}")

    print("🆕 Creando superadmin...")
    superadmin = Jugador(
        name="Gero",
        email=email,
        password=hashed_password,
        salt=salt,  # Guardamos el salt en la base de datos
        nickhabbo="SuperGero",
        role="superadmin",
        is_active=True,
        is_registered=True
    )

    db.session.add(superadmin)
    db.session.commit()
    print("✅ Superadmin creado con éxito")

with app.app_context():
    db.create_all()  # Asegura que las tablas existen antes de crear el superadmin
    crear_superadmin()


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
