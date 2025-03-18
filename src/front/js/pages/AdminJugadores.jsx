import React, { useEffect, useContext, useState } from "react";
import { Context } from "../store/appContext";
import Swal from "sweetalert2";
import { PlusCircle, Trash2, XCircle } from "lucide-react";
import "../../styles/adminjugadores.css";

const PlayersList = () => {
    const { store, actions } = useContext(Context);
    const [selectedEquipo, setSelectedEquipo] = useState("");
    const [selectedJugador, setSelectedJugador] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        actions.getJugadores();
        actions.getEquipos();
    }, []);

    const filteredPlayers = store.jugadores.filter(jugador => {
        const matchesSearch = jugador.nickhabbo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTeam = selectedEquipo === "" || jugador.equipos.some(equipo => equipo.id === parseInt(selectedEquipo));
        return matchesSearch && matchesTeam;
    });

    const handleCreatePlayer = async () => {
        const { value: nickhabbo } = await Swal.fire({
            title: "Crear Nuevo Jugador",
            input: "text",
            inputPlaceholder: "Ingresa el NickHabbo",
            showCancelButton: true,
            confirmButtonText: "Crear",
            cancelButtonText: "Cancelar",
        });

        if (nickhabbo) {
            const response = await actions.createPlayerByAdmin(nickhabbo);
            if (response.success) {
                Swal.fire("Éxito", response.message, "success");
                actions.getJugadores(); // Recargar lista de jugadores
            } else {
                Swal.fire("Error", response.message, "error");
            }
        }
    };

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
                actions.getJugadores();
            } else {
                Swal.fire("Error", response.message, "error");
            }
        }
    };

    return (
        <div className="container">
            <h2 className="title">Lista de Jugadores</h2>

            <div className="controls-container">
                <button onClick={handleCreatePlayer} className="create-button">
                    <PlusCircle size={18} /> Crear Jugador
                </button>

                <input
                    type="text"
                    placeholder="Buscar por jugador..."
                    className="search-box"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select onChange={(e) => setSelectedEquipo(e.target.value)} className="select-box" value={selectedEquipo}>
                    <option value="">Todos los equipos</option>
                    {store.equipos.map(equipo => (
                        <option key={equipo.id} value={equipo.id}>{equipo.nombre} ({equipo.modalidad})</option>
                    ))}
                </select>
            </div>

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
                        <option key={equipo.id} value={equipo.id}>{equipo.nombre} ({equipo.modalidad})</option>
                    ))}
                </select>
                <button onClick={handleAddPlayer} className="add-button">Añadir</button>
            </div>

            <div className="players-table-container">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>NickHabbo</th>
                            <th>AIC</th>
                            <th>HES</th>
                            <th>HFA</th>
                            <th>OHB</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlayers.map(jugador => (
                            <tr key={jugador.id}>
                                <td>{jugador.id}</td>
                                <td>{jugador.nickhabbo}</td>
                                {['AIC', 'HES', 'HFA', 'OHB'].map(modalidad => (
                                    <td key={modalidad}>
                                        {jugador.equipos.some(e => e.modalidad === modalidad) ? (
                                            jugador.equipos
                                                .filter(e => e.modalidad === modalidad)
                                                .map(equipo => (
                                                    <React.Fragment key={equipo.id}>
                                                        {equipo.nombre.length > 20 ? equipo.nombre.substring(0, 12) + "..." : equipo.nombre}
                                                        <button onClick={() => handleRemoveTeam(jugador.id, equipo.id)} className="remove-button">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </React.Fragment>
                                                ))
                                        ) : "-"}
                                    </td>
                                ))}
                                <td>
                                    <button onClick={() => handleDeletePlayer(jugador.id)} className="delete-button">
                                        <Trash2 size={16} /> Eliminar Jugador
                                    </button>
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
