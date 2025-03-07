"""empty message

Revision ID: 43dd8efaa63e
Revises: 
Create Date: 2025-03-04 19:56:03.825024

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '43dd8efaa63e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('asistencia',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('fecha_hora', sa.DateTime(), nullable=True),
    sa.Column('ip', sa.String(length=45), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('torneos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('modalidad', sa.String(length=50), nullable=False),
    sa.Column('formato', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('equipos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('torneo_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['torneo_id'], ['torneos.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_table('jugadores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=True),
    sa.Column('email', sa.String(length=80), nullable=True),
    sa.Column('password', sa.String(length=180), nullable=True),
    sa.Column('salt', sa.String(length=120), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_registered', sa.Boolean(), nullable=True),
    sa.Column('nickhabbo', sa.String(length=80), nullable=False),
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('equipo_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['equipo_id'], ['equipos.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('nickhabbo')
    )
    op.create_table('partidos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('torneo_id', sa.Integer(), nullable=False),
    sa.Column('equipo1_id', sa.Integer(), nullable=False),
    sa.Column('equipo2_id', sa.Integer(), nullable=False),
    sa.Column('goles_equipo1', sa.Integer(), nullable=True),
    sa.Column('goles_equipo2', sa.Integer(), nullable=True),
    sa.Column('arbitro_nombre', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['equipo1_id'], ['equipos.id'], ),
    sa.ForeignKeyConstraint(['equipo2_id'], ['equipos.id'], ),
    sa.ForeignKeyConstraint(['torneo_id'], ['torneos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('estadisticas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('partido_id', sa.Integer(), nullable=False),
    sa.Column('equipo_id', sa.Integer(), nullable=False),
    sa.Column('jugador_id', sa.Integer(), nullable=True),
    sa.Column('jugador_nombre', sa.String(length=80), nullable=True),
    sa.Column('tipo', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['equipo_id'], ['equipos.id'], ),
    sa.ForeignKeyConstraint(['jugador_id'], ['jugadores.id'], ),
    sa.ForeignKeyConstraint(['partido_id'], ['partidos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('estadisticas')
    op.drop_table('partidos')
    op.drop_table('jugadores')
    op.drop_table('equipos')
    op.drop_table('torneos')
    op.drop_table('asistencia')
    # ### end Alembic commands ###
