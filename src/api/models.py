from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
db = SQLAlchemy()

# Modelo de Torneos
class FormatoTorneo(db.Model):
    __tablename__ = "formatos_torneo"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)  # Liga, Eliminación, Grupos + Playoffs

class Torneo(db.Model):
    __tablename__ = "torneos"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    modalidad = db.Column(db.String(50), nullable=False)  # OHB, HFA, HES
    formato = db.Column(db.String(50), nullable=False)  
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    equipos = db.relationship('Equipo', backref='torneo', cascade="all, delete", lazy=True)
    partidos = db.relationship('Partido', backref='torneo', cascade="all, delete", lazy=True)

# Modelo de Equipos
class Equipo(db.Model):
    __tablename__ = "equipos"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    torneo_id = db.Column(db.Integer, db.ForeignKey('torneos.id'), nullable=False)
    jugadores = db.relationship('Jugador', backref='equipo', lazy=True)

# Modelo de Jugadores (Registro Opcional)
class Jugador(db.Model):
    __tablename__ = "jugadores"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=True)  # Se puede llenar después
    email = db.Column(db.String(80), nullable=True, unique=True)  
    password = db.Column(db.String(180), nullable=True)  
    salt = db.Column(db.String(120), nullable=True)  
    is_active = db.Column(db.Boolean, default=True)
    is_registered = db.Column(db.Boolean, default=False)  
    nickhabbo = db.Column(db.String(80), nullable=False, unique=True)  
    role = db.Column(db.String(50), nullable=False, default='jugador')  
    equipo_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=True)  
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

# Modelo de Partidos (Árbitro No Registrado)
class Partido(db.Model):
    __tablename__ = "partidos"
    id = db.Column(db.Integer, primary_key=True)
    torneo_id = db.Column(db.Integer, db.ForeignKey('torneos.id'), nullable=False)
    equipo1_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)
    equipo2_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)
    goles_equipo1 = db.Column(db.Integer, default=0)
    goles_equipo2 = db.Column(db.Integer, default=0)
    arbitro_nombre = db.Column(db.String(100), nullable=False)  # Nombre ingresado manualmente
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

# Modelo de Estadísticas (Goles, Asistencias, MVP, Menciones)
class Estadistica(db.Model):
    __tablename__ = "estadisticas"
    id = db.Column(db.Integer, primary_key=True)
    partido_id = db.Column(db.Integer, db.ForeignKey('partidos.id'), nullable=False)
    equipo_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)

    # Jugador (si está registrado, se usa el ID, si no, se usa el nombre)
    jugador_id = db.Column(db.Integer, db.ForeignKey('jugadores.id'), nullable=True)  
    jugador_nombre = db.Column(db.String(80), nullable=True)  

    tipo = db.Column(db.String(50), nullable=False)  # "gol", "asistencia", "mvp", "mencion_1t", "mencion_2t"
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

class Asistencia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    fecha_hora = db.Column(db.DateTime, default=datetime.utcnow)
    ip = db.Column(db.String(45), nullable=True)  # Guarda la IP del usuario

    def serialize(self, admin=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "fecha_hora": self.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
        }
        if admin:
            data["ip"] = self.ip  # Solo mostrar IP si es admin
        return data