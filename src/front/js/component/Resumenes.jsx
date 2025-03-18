import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import { useParams } from "react-router-dom";
import "../../styles/resumen.css"; // Importamos el CSS personalizado

const Resumenes = () => {
    const { store, actions } = useContext(Context);
    const { modalidad } = useParams();
    const [loading, setLoading] = useState(true);
    const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            await actions.getEquipos();
            await actions.getJugadores();
            await actions.obtenerResumenes();
            setLoading(false);
        };
        fetchData();
    }, []);

    const partidos = store.partidos || [];
    const jugadores = store.jugadores || [];
    const equipos = store.equipos || [];

    const jugadoresMap = jugadores.reduce((acc, jugador) => {
        acc[jugador.id] = jugador.nickhabbo;
        return acc;
    }, {});

    const equiposMap = equipos.reduce((acc, equipo) => {
        acc[equipo.id] = equipo.nombre;
        return acc;
    }, {});

    const partidosFiltrados = partidos.filter(partido => 
        partido.modalidad?.trim().toUpperCase() === modalidad?.trim().toUpperCase()
    );

    if (loading) {
        return <p className="loading-text">Cargando partidos...</p>;
    }

    return (
        <div className="resumenes-container">
            <h2 className="resumenes-title">Partidos de {modalidad?.toUpperCase()}</h2>
            <div className="resumenes-list">
                {partidosFiltrados.length > 0 ? (
                    partidosFiltrados.map((partido) => (
                        <div key={partido.id} className="resumen-card" onClick={() => setPartidoSeleccionado(partido)}>
                            <h4 className="resumen-equipos">
                                {equiposMap[partido.equipo_a_id] || "Desconocido"} 🆚 {equiposMap[partido.equipo_b_id] || "Desconocido"}
                            </h4>
                            <p className="resumen-resultado">{partido.goles_equipo_a} - {partido.goles_equipo_b}</p>
                        </div>
                    ))
                ) : (
                    <p className="no-partidos">No hay partidos disponibles para esta modalidad.</p>
                )}
            </div>

            {partidoSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h5 className="modal-title">Detalles del Partido</h5>
                            <button className="modal-close" onClick={() => setPartidoSeleccionado(null)}>✖</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Equipos:</strong> {equiposMap[partidoSeleccionado.equipo_a_id]} 🆚 {equiposMap[partidoSeleccionado.equipo_b_id]}</p>
                            <p><strong>Resultado:</strong> {partidoSeleccionado.goles_equipo_a} - {partidoSeleccionado.goles_equipo_b}</p>
                            <p><strong>Fecha:</strong> {partidoSeleccionado.fecha}</p>
                            <p><strong>Estado:</strong> {partidoSeleccionado.estado}</p>
                            <p><strong>Juez:</strong> {partidoSeleccionado.juez}</p>
                            <p><strong>MVP:</strong> {jugadoresMap[partidoSeleccionado.mvp_id] || "No asignado"}</p>
                            <p><strong>Mención especial (Equipo A):</strong> {jugadoresMap[partidoSeleccionado.mencion_equipo_a_id] || "No asignado"}</p>
                            <p><strong>Mención especial (Equipo B):</strong> {jugadoresMap[partidoSeleccionado.mencion_equipo_b_id] || "No asignado"}</p>

                            <h5 className="stats-title">📊 Estadísticas individuales:</h5>
                            <div className="stats-container">
                                <div className="stats-team">
                                    <h6 className="team-winner">{equiposMap[partidoSeleccionado.equipo_a_id]}</h6>
                                    <ul>
                                        {partidoSeleccionado.estadisticas?.filter(est => est.equipo_id === partidoSeleccionado.equipo_a_id).map(est => (
                                            <li key={est.jugador_id}>
                                                {jugadoresMap[est.jugador_id]}: {est.goles} goles, {est.asistencias} asistencias, {est.autogoles} autogoles
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="stats-team">
                                    <h6 className="team-loser">{equiposMap[partidoSeleccionado.equipo_b_id]}</h6>
                                    <ul>
                                        {partidoSeleccionado.estadisticas?.filter(est => est.equipo_id === partidoSeleccionado.equipo_b_id).map(est => (
                                            <li key={est.jugador_id}>
                                                {jugadoresMap[est.jugador_id]}: {est.goles} goles, {est.asistencias} asistencias, {est.autogoles} autogoles
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* 🚀 Observaciones restauradas */}
                            <p className="resumen-observaciones">
                                <strong>📝 Observaciones:</strong> {partidoSeleccionado.observaciones || "Ninguna"}
                            </p>

                            {partidoSeleccionado.link_video && (
                                <p>
                                    <strong>🎥 Video del Partido: </strong>
                                    <a href={partidoSeleccionado.link_video} target="_blank" rel="noopener noreferrer">
                                        Ver aquí
                                    </a>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resumenes;
