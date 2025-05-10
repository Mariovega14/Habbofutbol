import jwt
from flask import request, jsonify
from functools import wraps
from datetime import datetime, timezone
from os import getenv

SECRET_KEY = getenv("JWT_SECRET_KEY")  # Asegúrate de tener esta variable en tu entorno

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        
        if not token:
            return jsonify({"error": "Token requerido"}), 401

        try:
            token = token.split("Bearer ")[1]  # Extraer el token si viene con 'Bearer'
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Verificar si el token ha expirado
            if decoded_token["exp"] < datetime.now(timezone.utc).timestamp():
                return jsonify({"error": "Token expirado"}), 401

            return f(*args, **kwargs)  # Si el token es válido, continuar con la ruta

        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

    return decorated
