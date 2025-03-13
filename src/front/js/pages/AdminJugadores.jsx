import React, { useEffect, useContext, useState } from "react";
import { Context } from "../store/appContext";
import Swal from "sweetalert2";
import "../../styles/adminjugadores.css";

const PlayersList = () => {
    const { store, actions } = useContext(Context);
    const [selectedEquipo, setSelectedEquipo] = useState(null);
    const [selectedJugador, setSelectedJugador] = useState(null);

    useEffect(() => {
        actions.getJugadores();
        actions.getEquipos();
    }, []);

    const handleAddPlayer = async () => {
        if (!selectedJugador || !selectedEquipo) {
            Swal.fire("Error", "Selecciona un jugador y un equipo.", "error");
            return;
        }
        await actions.addPlayerToTeam(selectedJugador, selectedEquipo);
        actions.getJugadores();
    };

    const handleRemoveTeam = async (playerId, teamId) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción eliminará al jugador del equipo.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            await actions.removePlayerFromTeam(playerId, teamId);
            actions.getJugadores();
            Swal.fire("Eliminado", "El jugador ha sido eliminado del equipo.", "success");
        }
    };

    const handleDeletePlayer = async (playerId) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción eliminará al jugador permanentemente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });
    
        if (result.isConfirmed) {
            const response = await actions.deletePlayer(playerId);
            if (response.success) {
                Swal.fire("Eliminado", response.message, "success");
                actions.getJugadores(); // Actualizar lista después de eliminar
            } else {
                Swal.fire("Error", response.message, "error");
            }
        }
    };
    

    const openCreatePlayerModal = async () => {
        const { value: nickhabbo } = await Swal.fire({
            title: "Crear Nuevo Jugador",
            input: "text",
            inputLabel: "NickHabbo",
            inputPlaceholder: "Ingresa el nombre del jugador",
            showCancelButton: true,
            confirmButtonText: "Crear",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
                if (!value.trim()) {
                    return "El NickHabbo es obligatorio";
                }
            }
        });

        if (nickhabbo) {
            const result = await actions.createPlayerByAdmin(nickhabbo);
            if (result.success) {
                Swal.fire("Éxito", result.message, "success");
                actions.getJugadores(); // Actualizar la lista de jugadores
            } else {
                Swal.fire("Error", result.message, "error");
            }
        }
    };

    return (
        <div className="container">
            <h2 className="title">Lista de Jugadores</h2>

            {/* Botón para abrir el modal de creación */}
            <button onClick={openCreatePlayerModal} className="create-button">
                Crear Jugador
            </button>

            {/* Formulario para agregar jugadores a equipos */}
            <div className="form-container">
                <select onChange={(e) => setSelectedJugador(e.target.value)} className="select-box">
                    <option value="">Selecciona un jugador</option>
                    {store.jugadores.map(jugador => (
                        <option key={jugador.id} value={jugador.id}>{jugador.nickhabbo}</option>
                    ))}
                </select>
                <select onChange={(e) => setSelectedEquipo(e.target.value)} className="select-box">
                    <option value="">Selecciona un equipo</option>
                    {store.equipos.map(equipo => (
                        <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                    ))}
                </select>
                <button onClick={handleAddPlayer} className="add-button">Añadir</button>
            </div>

            {/* Tabla de jugadores */}
            <div className="players-table-container">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>NickHabbo</th>
                            <th>OHB</th>
                            <th>HES</th>
                            <th>HFA</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {store.jugadores.map(jugador => (
                            <tr key={jugador.id}>
                                <td>{jugador.id}</td>
                                <td>{jugador.nickhabbo}</td>
                                {['OHB', 'HES', 'HFA'].map(modalidad => (
                                    <td key={modalidad}>
                                        {jugador.equipos.some(e => e.modalidad === modalidad) ? (
                                            jugador.equipos
                                                .filter(e => e.modalidad === modalidad)
                                                .map(equipo => (
                                                    <React.Fragment key={equipo.id}>
                                                        {equipo.nombre.length > 20 ? equipo.nombre.substring(0, 12) + "..." : equipo.nombre}
                                                        <button onClick={() => handleRemoveTeam(jugador.id, equipo.id)} className="remove-button">✖</button>
                                                    </React.Fragment>
                                                ))
                                        ) : "-"}
                                    </td>
                                ))}
                                <td>
                                    <button onClick={() => handleDeletePlayer(jugador.id)} className="delete-button">🗑️ Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlayersList;
