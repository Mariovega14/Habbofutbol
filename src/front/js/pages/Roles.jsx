import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import "../../styles/roles.css";

const CustomPlayersWithRoles = () => {
    const { store, actions } = useContext(Context);
    const [roles, setRoles] = useState({});

    useEffect(() => {
        actions.getPlayersWithRoles();
    }, []);

    useEffect(() => {
        if (store.playersWithRoles.length > 0) {
            const initialRoles = store.playersWithRoles.reduce((acc, player) => {
                acc[player.id] = player.role;
                return acc;
            }, {});
            setRoles(initialRoles);
        }
    }, [store.playersWithRoles]);

    const rolesDisponibles = ["jugador", "árbitro", "dt", "admin"];

    const handleRoleChange = (playerId, newRole) => {
        setRoles({ ...roles, [playerId]: newRole });
    };

    return (
        <div className="custom-players-container">
            <h2 className="custom-players-title">Gestión de Roles</h2>
            <table className="custom-players-table">
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
                        store.playersWithRoles.map((player, index) => (
                            <tr key={player.id}>
                                <td>{index + 1}</td>
                                <td>{player.nickhabbo}</td>
                                <td>
                                    <select
                                        className="custom-role-select"
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
                                        className="custom-save-button"
                                        onClick={() => actions.updatePlayerRole(player.id, roles[player.id])}
                                    >
                                        Guardar
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="custom-no-players">No hay jugadores disponibles</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CustomPlayersWithRoles;
