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
    admin = Admin(app, name='Habbofutbol Admin', template_mode='bootstrap3')

    # Añadir tus modelos a la interfaz de administración
    admin.add_view(AdminModelView(Jugador, db.session))
    admin.add_view(AdminModelView(Equipo, db.session))
    admin.add_view(AdminModelView(Torneo, db.session))
    admin.add_view(AdminModelView(Partido, db.session))
    admin.add_view(AdminModelView(EstadisticaJugador, db.session))