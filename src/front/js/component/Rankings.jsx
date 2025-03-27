import React, { useEffect, useContext, useState } from "react";
import { Context } from "../store/appContext";
import { useParams } from "react-router-dom";
import "../../styles/rankings.css";

const Rankings = () => {
    const { store, actions } = useContext(Context);
    const { modalidad } = useParams();
    const modalidadUpper = modalidad ? modalidad.toUpperCase() : "";
    const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
    const [loadingTablas, setLoadingTablas] = useState(false);

    useEffect(() => {
        actions.getTorneosPorModalidad(modalidadUpper);
    }, [modalidadUpper]);

    useEffect(() => {
        const cargarTablas = async () => {
            if (torneoSeleccionado && torneoSeleccionado.id) {
                setLoadingTablas(true);
                console.log("📌 Torneo seleccionado:", torneoSeleccionado);

                await Promise.all([
                    actions.getTablaGoleadoresPorTorneo(torneoSeleccionado.id),
                    actions.getTablaAsistidoresPorTorneo(torneoSeleccionado.id),
                    actions.getTablaMvps(),
                    actions.getTablaMenciones(),
                    torneoSeleccionado.formato !== "eliminacion_directa"
                        ? actions.getTablaEquiposPorTorneo(torneoSeleccionado.id)
                        : null
                ]);

                setLoadingTablas(false);
            } else {
                console.warn("⚠️ No hay torneo seleccionado, no se pueden cargar las tablas.");
            }
        };

        cargarTablas();
    }, [torneoSeleccionado]);

    return (
        <div className="rankings-container">
            <h2>Rankings de {modalidadUpper}</h2>

            {/* Selector de Torneo */}
            <select
                onChange={(e) => {
                    const torneo = store.torneos.find(t => t.id == e.target.value);
                    setTorneoSeleccionado(torneo);
                }}
                className="torneo-select"
            >
                <option value="">Selecciona un Torneo</option>
                {store.torneos
                    .filter(t => t.modalidad.toUpperCase() === modalidadUpper)
                    .map(torneo => (
                        <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>
                    ))
                }
            </select>

            {loadingTablas ? (
                <div className="spinner-wrapper">
                    <div className="spinner"></div>
                    <p className="spinner-text">Cargando datos del torneo...</p>
                </div>
            ) : torneoSeleccionado ? (
                <>
                    <div className="rankings-wrapper">

                        {/* Tabla de Equipos */}
                        {torneoSeleccionado.formato !== "eliminacion_directa" && (
                            <>
                                <h3>Tabla de Equipos</h3>
                                <div className="rankings-table-container">
                                    <table className="rankings-table">
                                        <thead>
                                            <tr>
                                                <th>#</th><th>Equipo</th><th>PJ</th><th>G</th>
                                                <th>E</th><th>P</th><th>GF</th>
                                                <th>GC</th><th>DG</th><th className="pts-column">PTS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.tablaEquipos?.map((equipo, index) => (
                                                <tr key={index}>
                                                    <td className="team-rank">{index + 1}</td>
                                                    <td>{equipo.equipo}</td>
                                                    <td>{equipo.partidos_jugados}</td>
                                                    <td>{equipo.ganados}</td>
                                                    <td>{equipo.empatados}</td>
                                                    <td>{equipo.perdidos}</td>
                                                    <td>{equipo.goles_favor}</td>
                                                    <td>{equipo.goles_contra}</td>
                                                    <td>{equipo.diferencia_goles}</td>
                                                    <td className="pts-column">{equipo.puntos}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tabla de Goleadores */}
                    <h3>Máximos Goleadores</h3>
                    <table className="rankings-table">
                        <thead>
                            <tr><th>Jugador</th><th>Goles</th></tr>
                        </thead>
                        <tbody>
                            {store.tablaGoleadores?.slice(0, 10).map((jugador, index) => (
                                <tr key={index}><td>{jugador.nickhabbo}</td><td>{jugador.goles}</td></tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tabla de Asistidores */}
                    <h3>Máximos Asistidores</h3>
                    <table className="rankings-table">
                        <thead>
                            <tr><th>Jugador</th><th>Asistencias</th></tr>
                        </thead>
                        <tbody>
                            {store.tablaAsistidores?.slice(0, 10).map((jugador, index) => (
                                <tr key={index}><td>{jugador.nickhabbo}</td><td>{jugador.asistencias}</td></tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tabla de MVPs */}
                    <h3>Jugadores con más MVPs</h3>
                    <table className="rankings-table">
                        <thead>
                            <tr><th>Jugador</th><th>MVPs</th></tr>
                        </thead>
                        <tbody>
                            {store.tablaMvps?.slice(0, 10).map((jugador, index) => (
                                <tr key={index}><td>{jugador.nickhabbo}</td><td>{jugador.mvps}</td></tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tabla de Menciones */}
                    <h3>Jugadores con más Menciones</h3>
                    <table className="rankings-table">
                        <thead>
                            <tr><th>Jugador</th><th>Menciones</th></tr>
                        </thead>
                        <tbody>
                            {store.tablaMenciones?.slice(0, 10).map((jugador, index) => (
                                <tr key={index}><td>{jugador.nickhabbo}</td><td>{jugador.menciones}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <p>Selecciona un torneo para ver las tablas.</p>
            )}
        </div>
    );
};

export default Rankings;
