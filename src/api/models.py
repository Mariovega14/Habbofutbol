from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# 🔹 Modelo intermedio para la relación Many-to-Many (Jugador - Equipo)
class JugadorEquipo(db.Model):
    __tablename__ = "jugadores_equipos"
    jugador_id = db.Column(db.Integer, db.ForeignKey("jugadores.id"), primary_key=True)
    equipo_id = db.Column(db.Integer, db.ForeignKey("equipos.id"), primary_key=True)
    modalidad = db.Column(db.String(50), nullable=False)

    jugador = db.relationship("Jugador", back_populates="jugadores_equipos")
    equipo = db.relationship("Equipo", back_populates="jugadores_equipos")

# 🔹 Modelo de Formatos de Torneo
class FormatoTorneo(db.Model):
    __tablename__ = "formatos_torneo"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)  

# 🔹 Modelo de Torneos
class Torneo(db.Model):
    __tablename__ = "torneos"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    modalidad = db.Column(db.String(50), nullable=False)  
    formato = db.Column(db.String(50), nullable=False)  
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    equipos = db.relationship('Equipo', backref='torneo', cascade="all, delete", lazy=True)
    partidos = db.relationship('Partido', backref='torneo', cascade="all, delete", lazy=True)

# 🔹 Modelo de Equipos
class Equipo(db.Model):
    __tablename__ = "equipos"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    torneo_id = db.Column(db.Integer, db.ForeignKey('torneos.id'), nullable=False)
    logo_url = db.Column(db.String(255), nullable=True)

    jugadores_equipos = db.relationship("JugadorEquipo", back_populates="equipo", lazy="joined")

# 🔹 Modelo de Jugadores
class Jugador(db.Model):
    __tablename__ = "jugadores"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=True)  
    email = db.Column(db.String(80), nullable=True, unique=True)  
    password = db.Column(db.String(180), nullable=True)  
    salt = db.Column(db.String(120), nullable=True)  
    is_active = db.Column(db.Boolean, default=True)
    is_registered = db.Column(db.Boolean, default=False)  
    nickhabbo = db.Column(db.String(80), nullable=False, unique=True)  
    role = db.Column(db.String(50), nullable=False, default='jugador')  
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    jugadores_equipos = db.relationship("JugadorEquipo", back_populates="jugador", lazy="joined")

    def serialize(self):
        return {
            "id": self.id,
            "nickhabbo": self.nickhabbo,
            "equipos": [
                {"id": je.equipo.id, "nombre": je.equipo.nombre, "modalidad": je.modalidad}
                for je in self.jugadores_equipos
            ]
        }

# 🔹 Modelo de Partidos
class Partido(db.Model):
    __tablename__ = "partidos"
    id = db.Column(db.Integer, primary_key=True)
    torneo_id = db.Column(db.Integer, db.ForeignKey('torneos.id'), nullable=False)
    equipo_a_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)
    equipo_b_id = db.Column(db.Integer, db.ForeignKey('equipos.id'), nullable=False)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    estado = db.Column(db.String(20), default="finalizado")  
    juez = db.Column(db.String(100), nullable=True)
    goles_equipo_a = db.Column(db.Integer, default=0)
    goles_equipo_b = db.Column(db.Integer, default=0)
    mvp_id = db.Column(db.Integer, db.ForeignKey('jugadores.id'), nullable=True)
    mencion_equipo_a_id = db.Column(db.Integer, db.ForeignKey('jugadores.id'), nullable=True)
    mencion_equipo_b_id = db.Column(db.Integer, db.ForeignKey('jugadores.id'), nullable=True)
    link_video = db.Column(db.String(255), nullable=True)
    observaciones = db.Column(db.Text, nullable=True)

    estadisticas = db.relationship('EstadisticaJugador', backref='partido', cascade="all, delete", lazy=True)

# 🔹 Modelo de Estadísticas de Jugadores
class EstadisticaJugador(db.Model):
    __tablename__ = "estadisticas_jugador"
    id = db.Column(db.Integer, primary_key=True)
    partido_id = db.Column(db.Integer, db.ForeignKey('partidos.id'), nullable=False)
    jugador_id = db.Column(db.Integer, db.ForeignKey('jugadores.id'), nullable=False)
    goles = db.Column(db.Integer, default=0)
    asistencias = db.Column(db.Integer, default=0)
    autogoles = db.Column(db.Integer, default=0)

    jugador = db.relationship("Jugador", backref="estadisticas")

# 🔹 Modelo de Asistencia
class Asistencia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    fecha_hora = db.Column(db.DateTime, default=datetime.utcnow)
    ip = db.Column(db.String(45), nullable=True)  

    def serialize(self, admin=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "fecha_hora": self.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
        }
        
        if admin:
            data["ip"] = self.ip  
        return data