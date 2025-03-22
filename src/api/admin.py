from flask import request, jsonify
import os
from flask_admin import Admin
from .models import db, Jugador, Equipo, Torneo, Partido, EstadisticaJugador
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'

    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

    # Vistas de administración disponibles siempre, sin restricciones
    admin.add_view(ModelView(Jugador, db.session))
    admin.add_view(ModelView(Equipo, db.session))
    admin.add_view(ModelView(Torneo, db.session))
    admin.add_view(ModelView(Partido, db.session))
    admin.add_view(ModelView(EstadisticaJugador, db.session))




