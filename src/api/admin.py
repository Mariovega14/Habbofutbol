from flask import request, jsonify
import os
from flask_admin import Admin
from .models import db, Jugador, Equipo, Torneo, Partido, EstadisticaJugador
from flask_admin.contrib.sqla import ModelView


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
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




