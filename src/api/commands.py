import click
from api.models import db, Jugador

def setup_commands(app):
    
    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            jugador = Jugador()
            jugador.email = "test_user" + str(x) + "@test.com"
            jugador.password = "123456"
            jugador.is_active = True
            db.session.add(jugador)
            db.session.commit()
            print("Jugador: ", jugador.email, " creado.")

        print("Todos los jugadores de prueba han sido creados")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass
