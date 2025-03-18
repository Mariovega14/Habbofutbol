import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/partidos.css";

const RegistroPartido = () => {
    const { store, actions } = useContext(Context);


    const [torneoId, setTorneoId] = useState("");
    const [equipoAId, setEquipoAId] = useState("");
    const [equipoBId, setEquipoBId] = useState("");
    const [jugadoresEquipoA, setJugadoresEquipoA] = useState([]);
    const [jugadoresEquipoB, setJugadoresEquipoB] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [juez, setJuez] = useState("");
    const [golesEquipoA, setGolesEquipoA] = useState(0);
    const [golesEquipoB, setGolesEquipoB] = useState(0);
    const [mvp, setMvp] = useState("");
    const [mencionA, setMencionA] = useState("");
    const [mencionB, setMencionB] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [linkVideo, setLinkVideo] = useState("");
    const [jugadoresSeleccionadosA, setJugadoresSeleccionadosA] = useState([]);
    const [jugadoresSeleccionadosB, setJugadoresSeleccionadosB] = useState([]);


    useEffect(() => {
        actions.getTorneos();
    }, []);


    useEffect(() => {
        if (torneoId) {
            actions.getEquiposPorTorneo(torneoId);
        }
    }, [torneoId]);


    useEffect(() => {
        if (equipoAId) {
            actions.getJugadoresPorEquipo(equipoAId).then((data) => {
                console.log("Jugadores de equipo A:", data); // Agregar este log
                setJugadoresEquipoA(data || []);
            });
        }
        if (equipoBId) {
            actions.getJugadoresPorEquipo(equipoBId).then((data) => {
                console.log("Jugadores de equipo B:", data); // Agregar este log
                setJugadoresEquipoB(data || []);
            });
        }
    }, [equipoAId, equipoBId]);


    // Manejar cambios en estadísticas (sin cambios)
    const handleStatChange = (jugadorId, stat, value) => {
        setEstadisticas({
            ...estadisticas,
            [jugadorId]: {
                ...estadisticas[jugadorId],
                [stat]: Number(value) || 0
            },
        });
    };

    const toggleSeleccionJugador = (jugadorId, equipo) => {
        if (equipo === "A") {
            setJugadoresSeleccionadosA(prev =>
                prev.includes(jugadorId)
                    ? prev.filter(id => id !== jugadorId) // Quita el jugador si ya está en la lista
                    : [...prev, jugadorId] // Agrega el jugador si no está en la lista
            );
        } else {
            setJugadoresSeleccionadosB(prev =>
                prev.includes(jugadorId)
                    ? prev.filter(id => id !== jugadorId)
                    : [...prev, jugadorId]
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const partidoData = {
            torneo_id: Number(torneoId) || 0,
            equipo_a_id: Number(equipoAId) || 0,
            equipo_b_id: Number(equipoBId) || 0,
            juez: juez.trim() || "Desconocido",
            goles_equipo_a: Number(golesEquipoA) || 0,
            goles_equipo_b: Number(golesEquipoB) || 0,
            estadisticas: Object.entries(estadisticas).map(([jugador_id, stats]) => ({
                jugador_id: Number(jugador_id),
                goles: stats.goles || 0,
                asistencias: stats.asistencias || 0,
                autogoles: stats.autogoles || 0
            })),
            mvp_id: Number(mvp) || 0,
            mencion_equipo_a_id: Number(mencionA) || 0,
            mencion_equipo_b_id: Number(mencionB) || 0,
            observaciones: observaciones.trim() || "Sin observaciones",
            link_video: linkVideo.startsWith("http") ? linkVideo.trim() : null,
        };

        console.log("📤 Enviando datos al backend:", JSON.stringify(partidoData, null, 2));

        if (!torneoId || !equipoAId || !equipoBId || !juez || !mvp || !mencionA || !mencionB) {
            alert("❌ Todos los campos son obligatorios.");
            return;
        }

        const resultado = await actions.registrarPartido(partidoData);
        if (resultado.success) {
            alert("✅ Partido registrado con éxito");
        } else {
            alert(`${resultado.message}`);
        }
    };

    return (
        <div className="registro-partido">
            <form onSubmit={handleSubmit}>
                {/* Primera fila: Torneo, Equipo A, Equipo B */}
                <div className="registro-form-section">
                    <label className="registro-label">Torneo:</label>
                    <select className="registro-select" value={torneoId} onChange={(e) => setTorneoId(e.target.value)} required>
                        <option value="">Seleccionar Torneo</option>
                        {store.torneos.map((torneo) => (
                            <option key={torneo.id} value={torneo.id}>{torneo.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="registro-form-section">
                    <label className="registro-equiposA">Equipo A:</label>
                    <select value={equipoAId} onChange={(e) => setEquipoAId(e.target.value)} required>
                        <option value="">Seleccionar Equipo A</option>
                        {store.equipos.map((equipo) => (
                            <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="form-section">
                    <label className="registro-equiposB">Equipo B:</label>
                    <select value={equipoBId} onChange={(e) => setEquipoBId(e.target.value)} required>
                        <option value="">Seleccionar Equipo B</option>
                        {store.equipos.map((equipo) => (
                            <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Segunda fila: Juez, Goles Equipo A, Goles Equipo B */}
                <div className="form-section">
                    <label>Nombre del Juez:</label>
                    <input type="text" value={juez} onChange={(e) => setJuez(e.target.value)} required />
                </div>

                <div className="form-section">
                    <label>Goles Equipo A:</label>
                    <input type="number" min="0" value={golesEquipoA} onChange={(e) => setGolesEquipoA(e.target.value)} required />
                </div>

                <div className="form-section">
                    <label>Goles Equipo B:</label>
                    <input type="number" min="0" value={golesEquipoB} onChange={(e) => setGolesEquipoB(e.target.value)} required />
                </div>

                <h3 className="titulo-estadistica">Estadísticas</h3>

                {/* Selección de jugadores para el Equipo A */}
                <div>
                    <h4>Seleccionar jugadores de Equipo A:</h4>
                    {jugadoresEquipoA.map((jugador) => (
                        <label key={jugador.id}>
                            <input
                                type="checkbox"
                                checked={jugadoresSeleccionadosA.includes(jugador.id)}
                                onChange={() => toggleSeleccionJugador(jugador.id, "A")}
                            />
                            {jugador.nickhabbo}
                        </label>
                    ))}
                </div>

                {/* Selección de jugadores para el Equipo B */}
                <div>
                    <h4>Seleccionar jugadores de Equipo B:</h4>
                    {jugadoresEquipoB.map((jugador) => (
                        <label key={jugador.id}>
                            <input
                                type="checkbox"
                                checked={jugadoresSeleccionadosB.includes(jugador.id)}
                                onChange={() => toggleSeleccionJugador(jugador.id, "B")}
                            />
                            {jugador.nickhabbo}
                        </label>
                    ))}
                </div>

                {/* Tercera fila: Estadísticas de jugadores */}
                <div className="registro-jugadores-container">

                    <div className="registro-equiposA">
                        <h4>Equipo A</h4>
                        {jugadoresSeleccionadosA.map(jugadorId => {
                            const jugador = jugadoresEquipoA.find(j => j.id === jugadorId);
                            return (
                                <div key={jugador.id} className="jugador">
                                    <span>{jugador.nickhabbo}</span>
                                    <input type="number" min="0" placeholder="Goles" onChange={(e) => handleStatChange(jugador.id, "goles", e.target.value)} />
                                    <input type="number" min="0" placeholder="Asistencias" onChange={(e) => handleStatChange(jugador.id, "asistencias", e.target.value)} />
                                    <input type="number" min="0" placeholder="Autogoles" onChange={(e) => handleStatChange(jugador.id, "autogoles", e.target.value)} />
                                </div>
                            );
                        })}
                    </div>

                    <div className="registro-equiposB">
                        <h4>Equipo B</h4>
                        {jugadoresSeleccionadosB.map(jugadorId => {
                            const jugador = jugadoresEquipoB.find(j => j.id === jugadorId);
                            return (
                                <div key={jugador.id} className="registro-jugador">
                                    <span>{jugador.nickhabbo}</span>
                                    <input type="number" min="0" placeholder="Goles" onChange={(e) => handleStatChange(jugador.id, "goles", e.target.value)} />
                                    <input type="number" min="0" placeholder="Asistencias" onChange={(e) => handleStatChange(jugador.id, "asistencias", e.target.value)} />
                                    <input type="number" min="0" placeholder="Autogoles" onChange={(e) => handleStatChange(jugador.id, "autogoles", e.target.value)} />
                                </div>
                            );
                        })}
                    </div>

                </div>


                {/* Cuarta fila: MVP, Menciones, Observaciones, Link de Video */}
                <div className="form-section">
                    <label>MVP:</label>
                    <select value={mvp} onChange={(e) => setMvp(e.target.value)} required>
                        <option value="">Seleccionar MVP</option>
                        {[...jugadoresEquipoA, ...jugadoresEquipoB].map((jugador) => (
                            <option key={jugador.id} value={jugador.id}>{jugador.nickhabbo}</option>
                        ))}
                    </select>
                </div>

                <div className="form-section">
                    <label>Mención A:</label>
                    <select value={mencionA} onChange={(e) => setMencionA(e.target.value)} required>
                        <option value="">Seleccionar Jugador del Equipo A</option>
                        {jugadoresEquipoA.map((jugador) => (
                            <option key={jugador.id} value={jugador.id}>{jugador.nickhabbo}</option>
                        ))}
                    </select>
                </div>

                <div className="form-section">
                    <label>Mención B:</label>
                    <select value={mencionB} onChange={(e) => setMencionB(e.target.value)} required>
                        <option value="">Seleccionar Jugador del Equipo B</option>
                        {jugadoresEquipoB.map((jugador) => (
                            <option key={jugador.id} value={jugador.id}>{jugador.nickhabbo}</option>
                        ))}
                    </select>
                </div>

                <div className="form-section">
                    <label>Observaciones:</label>
                    <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>

                <div className="form-section">
                    <label>Enlace (Opcional):</label>
                    <input type="text" value={linkVideo} onChange={(e) => setLinkVideo(e.target.value)} />
                </div>

                {/* Botón de enviar */}
                <button type="submit" className="registro-button">Registrar Partido</button>
            </form>
        </div>
    );
};

export default RegistroPartido;