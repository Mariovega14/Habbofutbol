import os
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask import request, jsonify
import jwt
from .models import db, Jugador, Equipo, Torneo, Partido, EstadisticaJugador

# Definir la vista personalizada
class AdminModelView(ModelView):
    def is_accessible(self):
        # Obtener el token JWT de los headers de la solicitud
        token = request.headers.get('Authorization')

        if token:
            try:
                # Decodificar el token para verificar la validez
                payload = jwt.decode(token, 'API_KEY', algorithms=["HS256"])
                # Aquí puedes verificar si el usuario tiene un rol de administrador
                # Suponiendo que el payload contiene un campo 'role' que define el rol
                if payload.get("role") == "superadmin":
                    return True
            except jwt.ExpiredSignatureError:
                return False
            except jwt.InvalidTokenError:
                return False

        return False  # Si no hay token o no es admin, no se permite el acceso

# Configuración de Flask-Admin
def setup_admin(app):
    app.secret_key = 'your_secret_key'
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'


    # Solo inicializa Flask-Admin si estamos en modo desarrollo
    if os.environ.get('FLASK_ENV') == 'development':  # Puedes controlar esto con la variable FLASK_ENV
        admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

        # Agregar las vistas de administración solo en desarrollo
        admin.add_view(ModelView(Jugador, db.session))
        admin.add_view(ModelView(Equipo, db.session))
        admin.add_view(ModelView(Torneo, db.session))
        admin.add_view(ModelView(Partido, db.session))
        admin.add_view(ModelView(EstadisticaJugador, db.session))
    else:
        # Bloquear completamente el acceso a la ruta /admin en producción
        @app.before_request
        def block_admin_access():
            if '/admin' in request.path:
                return jsonify({"message": "Acceso a /admin deshabilitado en producción"}), 403

