import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import "../../styles/roles.css";

const PlayersWithRoles = () => {
    const { store, actions } = useContext(Context);
    const [roles, setRoles] = useState({}); // Estado local para almacenar los roles seleccionados
    const [filtro, setFiltro] = useState("");

    useEffect(() => {
        actions.getPlayersWithRoles(); // Cargar jugadores al montar
    }, []);

    useEffect(() => {
        // Inicializa los valores de los roles cuando llegan los datos
        if (store.playersWithRoles.length > 0) {
            const initialRoles = store.playersWithRoles.reduce((acc, player) => {
                acc[player.id] = player.role;
                return acc;
            }, {});
            setRoles(initialRoles);
        }
    }, [store.playersWithRoles]);

    const rolesDisponibles = ["jugador", "arbitro", "dt", "admin"];

    const handleRoleChange = (playerId, newRole) => {
        setRoles({ ...roles, [playerId]: newRole });
    };

    return (
        <div className="players-roles-container mt-4">
            <h2 className="mb-3">Lista de Jugadores y Roles</h2>
            <input
                type="text"
                className="input-filtro-jugador"
                placeholder="🔍 Buscar por nick o rol..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value.toLowerCase())}
            />
            <table className="players-roles-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nick</th>
                        <th>Rol</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {store.playersWithRoles.length > 0 ? (
                        store.playersWithRoles
                            .filter((player) => {
                                const nick = player.nickhabbo?.toLowerCase() || "";
                                const role = player.role?.toLowerCase() || "";
                                return nick.includes(filtro) || role.includes(filtro);
                            })
                            .map((player, index) => (
                                <tr key={player.id}>
                                    <td>{index + 1}</td>
                                    <td>{player.nickhabbo}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={roles[player.id] || player.role}
                                            onChange={(e) => handleRoleChange(player.id, e.target.value)}
                                        >
                                            {rolesDisponibles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() =>
                                                actions.updatePlayerRole(player.id, roles[player.id])
                                            }
                                        >
                                            Guardar
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center">
                                No hay jugadores disponibles
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PlayersWithRoles;
