import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/torneos.css";

const Torneos = () => {
    const { store, actions } = useContext(Context);
    const [showModal, setShowModal] = useState(false);
    const [nombre, setNombre] = useState("");
    const [modalidad, setModalidad] = useState("");
    const [formato, setFormato] = useState("");

    useEffect(() => {
        actions.getTorneos(); // Cargar torneos al montar el componente
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nombre || !modalidad || !formato) {
            alert("Todos los campos son obligatorios");
            return;
        }

        const torneoId = await actions.crearTorneo(nombre, modalidad, formato);
        if (torneoId) {
            alert(`Torneo "${nombre}" creado con éxito`);
            setNombre("");
            setModalidad("");
            setFormato("");
            setShowModal(false);
            actions.getTorneos(); // Recargar la lista de torneos
        } else {
            alert("Error al crear torneo");
        }
    };

    return (
        <div className="torneos-container">
            <h1>Lista de Torneos</h1>
            <button className="crear-torneo-btn" onClick={() => setShowModal(true)}>
                Crear Torneo
            </button>

            <div className="torneos-list">
                {["OHB", "HFA", "HES"].map((tipo) => (
                    <div key={tipo} className="modalidad-section">
                        <h2>{tipo}</h2>
                        <ul>
                            {store.torneos
                                .filter((torneo) => torneo.modalidad === tipo)
                                .map((torneo) => (
                                    <li key={torneo.id} className="torneo-item">
                                        <strong>{torneo.nombre}</strong> - {torneo.formato}
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Modal para crear torneo */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>
                            &times;
                        </span>
                        <h2>Crear Nuevo Torneo</h2>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <label>Nombre del Torneo:</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                            </div>

                            <div>
                                <label>Modalidad:</label>
                                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} required>
                                    <option value="">-- Selecciona una modalidad --</option>
                                    <option value="OHB">OHB</option>
                                    <option value="HFA">HFA</option>
                                    <option value="HES">HES</option>
                                </select>
                            </div>

                            <div>
                                <label>Formato:</label>
                                <select value={formato} onChange={(e) => setFormato(e.target.value)} required>
                                    <option value="">-- Selecciona un formato --</option>
                                    <option value="liga">Liga</option>
                                    <option value="eliminacion">Eliminación Directa</option>
                                    <option value="grupos_playoffs">Grupos + Playoffs</option>
                                </select>
                            </div>

                            <button type="submit">Crear Torneo</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Torneos;
