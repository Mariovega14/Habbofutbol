import React, { useEffect, useContext, useState } from "react";
import { Context } from "../store/appContext";
import "../../styles/adminjugadores.css";

const AdminPlayers = () => {
    const { store, actions } = useContext(Context);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [newNick, setNewNick] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [creatingPlayer, setCreatingPlayer] = useState(false);
    const [newPlayerNick, setNewPlayerNick] = useState("");
    const [selectedEquipo, setSelectedEquipo] = useState(""); // Estado para el equipo seleccionado

    useEffect(() => {
        actions.getJugadores();
        actions.getEquipos(); // Asegúrate de cargar los equipos al inicio
    }, []);

    console.log("Equipos:", store.equipos);
    console.log("Jugadores:", store.jugadores);

    const getEquipoNombre = (equipoId) => {
        if (!equipoId) return "Sin equipo"; // Si no tiene equipo asignado
        const equipo = store.equipos.find((e) => e.id === equipoId);
        return equipo ? equipo.nombre : "Equipo no encontrado";
    };
    
    // Función para añadir un jugador a un equipo
    const handleAddToTeam = async (jugadorId) => {
        if (!selectedEquipo) {
            setErrorMessage("Debes seleccionar un equipo.");
            return;
        }

        const result = await actions.agregarJugadorAEquipo(selectedEquipo, jugadorId);

        if (result.success) {
            setSuccessMessage("Jugador añadido al equipo correctamente.");
            setTimeout(() => setSuccessMessage(""), 1500);
        } else {
            setErrorMessage("Error al añadir el jugador al equipo.");
        }
    };

    // Función para eliminar un jugador de un equipo
    const handleRemoveFromTeam = async (jugadorId) => {
        if (!selectedEquipo) {
            setErrorMessage("Debes seleccionar un equipo.");
            return;
        }

        const result = await actions.eliminarJugadorDeEquipo(selectedEquipo, jugadorId);

        if (result.success) {
            setSuccessMessage("Jugador eliminado del equipo correctamente.");
            setTimeout(() => setSuccessMessage(""), 1500);
        } else {
            setErrorMessage("Error al eliminar el jugador del equipo.");
        }
    };

    // Función para manejar la edición de un jugador
    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setNewNick(player.nickhabbo);
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Función para cerrar el modal de edición
    const handleCloseModal = () => {
        setEditingPlayer(null);
        setNewNick("");
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Función para actualizar el nick de un jugador
    const handleUpdateNick = async () => {
        if (!editingPlayer || !newNick) {
            setErrorMessage("El NickHabbo no puede estar vacío.");
            return;
        }

        const result = await actions.updatePlayerNick(editingPlayer.id, newNick);

        if (result.success) {
            setSuccessMessage(result.message);
            setTimeout(() => {
                handleCloseModal();
                actions.getJugadores();
            }, 1500);
        } else {
            setErrorMessage(result.message);
        }
    };

    // Función para manejar la creación de un nuevo jugador
    const handleCreatePlayerClick = () => {
        setCreatingPlayer(true);
        setNewPlayerNick("");
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Función para cerrar el modal de creación
    const handleCloseCreateModal = () => {
        setCreatingPlayer(false);
        setNewPlayerNick("");
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Función para crear un nuevo jugador
    const handleCreatePlayer = async () => {
        if (!newPlayerNick) {
            setErrorMessage("El NickHabbo no puede estar vacío.");
            return;
        }

        const result = await actions.createPlayerByAdmin(newPlayerNick);

        if (result.success) {
            setSuccessMessage(result.message);
            setTimeout(() => {
                handleCloseCreateModal();
                actions.getJugadores();
            }, 1500);
        } else {
            setErrorMessage(result.message);
        }
    };

    // Filtrar jugadores
    const filteredJugadores = (store.jugadores || []).filter(jugador => {
        const searchLower = searchTerm.toLowerCase();
        return (
            jugador.name?.toLowerCase().includes(searchLower) ||
            jugador.nickhabbo.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="admin-players-container">
            <h2 className="admin-players-title">Lista de Jugadores</h2>

            {/* Barra de búsqueda y botón de creación */}
            <div className="admin-players-search-container">
                <input
                    type="text"
                    className="admin-players-search-input"
                    placeholder="Buscar jugador por nombre o nickhabbo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    className="admin-players-create-button"
                    onClick={handleCreatePlayerClick}
                >
                    Crear Jugador
                </button>
            </div>

            {/* Selector de equipos */}
            <div className="admin-players-team-selector">
                <label>Seleccionar equipo: </label>
                <select
                    value={selectedEquipo}
                    onChange={(e) => setSelectedEquipo(e.target.value)}
                >
                    <option value="">Selecciona un equipo</option>
                    {store.equipos && store.equipos.map((equipo) => (
                        <option key={equipo.id} value={equipo.id}>
                            {equipo.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabla de jugadores */}
            <table className="admin-players-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>NickHabbo</th>
                        <th>Equipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredJugadores.length > 0 ? (
                        filteredJugadores.map((jugador) => (
                            <tr key={jugador.id}>
                                <td>{jugador.id}</td>
                                <td>{jugador.name}</td>
                                <td>{jugador.nickhabbo}</td>
                                <td>{jugador.equipo_id}</td>
                                
                                <td>
                                    <button
                                        className="admin-players-edit-button"
                                        onClick={() => handleEditClick(jugador)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="admin-players-add-button"
                                        onClick={() => handleAddToTeam(jugador.id)}
                                    >
                                        Añadir a equipo
                                    </button>
                                    <button
                                        className="admin-players-remove-button"
                                        onClick={() => handleRemoveFromTeam(jugador.id)}
                                    >
                                        Eliminar de equipo
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="admin-players-empty">
                                No hay jugadores registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Modal para editar el nickhabbo */}
            {editingPlayer && (
                <div className="admin-players-modal-backdrop">
                    <div className="admin-players-modal-content">
                        <h3>Editar NickHabbo</h3>
                        <input
                            type="text"
                            className="admin-players-modal-input"
                            value={newNick}
                            onChange={(e) => setNewNick(e.target.value)}
                            placeholder="Nuevo NickHabbo"
                        />
                        {errorMessage && <div className="admin-players-error">{errorMessage}</div>}
                        {successMessage && <div className="admin-players-success">{successMessage}</div>}
                        <div className="admin-players-modal-actions">
                            <button className="admin-players-modal-cancel" onClick={handleCloseModal}>
                                Cancelar
                            </button>
                            <button className="admin-players-modal-save" onClick={handleUpdateNick}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para crear un nuevo jugador */}
            {creatingPlayer && (
                <div className="admin-players-modal-backdrop">
                    <div className="admin-players-modal-content">
                        <h3>Crear Jugador</h3>
                        <input
                            type="text"
                            className="admin-players-modal-input"
                            value={newPlayerNick}
                            onChange={(e) => setNewPlayerNick(e.target.value)}
                            placeholder="NickHabbo del nuevo jugador"
                        />
                        {errorMessage && <div className="admin-players-error">{errorMessage}</div>}
                        {successMessage && <div className="admin-players-success">{successMessage}</div>}
                        <div className="admin-players-modal-actions">
                            <button className="admin-players-modal-cancel" onClick={handleCloseCreateModal}>
                                Cancelar
                            </button>
                            <button className="admin-players-modal-save" onClick={handleCreatePlayer}>
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlayers;