import React, { useEffect, useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { Context } from "../store/appContext";
import "../../styles/equiposmodalidad.css";

const EquiposModalidad = () => {
    const { store, actions } = useContext(Context);
    const { modalidad } = useParams();
    const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
    const [jugadores, setJugadores] = useState([]);

    useEffect(() => {
        actions.getEquiposConLogo(); // ✅ Cargar equipos con logos
    }, []);

    const modalidadLower = modalidad ? modalidad.toLowerCase() : "";

    const equiposFiltrados = store.equipos
        ? store.equipos.filter(equipo => equipo.modalidad && equipo.modalidad.toLowerCase() === modalidadLower)
        : [];

    const handleClickEquipo = async (equipoId) => {
        setEquipoSeleccionado(equipoId);
        const jugadoresData = await actions.getJugadoresPorEquipo(equipoId);
        setJugadores(jugadoresData);
    };

    return (
        <div className="equipos-container">
            <h1 className="titulo">Equipos de la modalidad {modalidad}</h1>
            <ul className="equipos-lista">
                {equiposFiltrados.map(equipo => (
                    <li 
                        key={equipo.id} 
                        className={`equipo ${equipoSeleccionado === equipo.id ? "seleccionado" : ""}`}
                        onClick={() => handleClickEquipo(equipo.id)}
                    >
                        {equipo.logo_url && (
                            <img src={equipo.logo_url} alt={`${equipo.nombre} logo`} className="equipo-logo" />
                        )}
                        {equipo.nombre}
                    </li>
                ))}
            </ul>

            {equipoSeleccionado && (
                <div className="jugadores-container">
                    <h2>Jugadores del equipo seleccionado</h2>
                    <ul className="jugadores-lista">
                        {jugadores.length > 0 ? (
                            jugadores.map(jugador => (
                                <li key={jugador.id}>{jugador.nickhabbo}</li>
                            ))
                        ) : (
                            <p>No hay jugadores en este equipo.</p>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EquiposModalidad;
