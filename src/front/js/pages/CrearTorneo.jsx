import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/torneos.css";
import { PlusCircle, XCircle } from "lucide-react"; // 📌 Importamos iconos

const Torneos = () => {
    const { store, actions } = useContext(Context);
    const [showModal, setShowModal] = useState(false);
    const [nombre, setNombre] = useState("");
    const [modalidad, setModalidad] = useState("");
    const [formato, setFormato] = useState("");

    // ✅ Estado para el modal de confirmación de eliminación
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [torneoAEliminar, setTorneoAEliminar] = useState(null);

    useEffect(() => {
        actions.getTorneos();
    }, []);

    // ✅ Función para abrir el modal de creación
    const abrirModal = () => {
        console.log("Abriendo modal...");
        setShowModal(true);
    };

    // ✅ Función para cerrar el modal de creación
    const cerrarModal = () => {
        console.log("Cerrando modal...");
        setShowModal(false);
        setNombre("");
        setModalidad("");
        setFormato("");
    };

    // ✅ Función para abrir el modal de confirmación de eliminación
    const confirmarEliminacion = (torneo) => {
        setTorneoAEliminar(torneo);
        setShowDeleteModal(true);
    };

    // ✅ Función para eliminar el torneo después de la confirmación
    const eliminarTorneo = async () => {
        if (torneoAEliminar) {
            const resultado = await actions.eliminarTorneo(torneoAEliminar.id);
            if (resultado) {
                actions.getTorneos(); // Recargar lista
            }
            setShowDeleteModal(false);
            setTorneoAEliminar(null);
        }
    };

    // ✅ Enviar formulario para crear torneo
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nombre || !modalidad || !formato) {
            alert("Todos los campos son obligatorios");
            return;
        }

        console.log("Enviando torneo:", { nombre, modalidad, formato });

        const torneoId = await actions.crearTorneo(nombre, modalidad, formato);
        if (torneoId) {
            alert(`Torneo "${nombre}" creado con éxito`);
            actions.getTorneos();
            cerrarModal();
        } else {
            alert("Error al crear torneo");
        }
    };

    return (
        <div className="torneos-container">
            <h1 className="torneos-title">🏆 Torneos Disponibles</h1>

            {/* ✅ Botón flotante para crear torneo */}
            <button className="fab-button" onClick={abrirModal}>
                <PlusCircle size={24} /> Crear Torneo
            </button>

            {/* ✅ Tarjetas de torneos organizadas por modalidad */}
            <div className="torneos-grid">
                {["AIC", "HFA", "HES","OHB"].map((tipo) => (
                    <div key={tipo} className="modalidad-section">
                        <h2 className="modalidad-title">{tipo}</h2>
                        <div className="torneos-cards">
                            {store.torneos
                                .filter((torneo) => torneo.modalidad === tipo)
                                .map((torneo) => (
                                    <div key={torneo.id} className="torneo-card">
                                        {/* ❌ Botón de eliminar en la esquina superior derecha */}
                                        <XCircle 
                                            size={20} 
                                            className="delete-icon"
                                            onClick={() => confirmarEliminacion(torneo)}
                                        />
                                        <h3>{torneo.nombre}</h3>
                                        <p><strong>Formato:</strong> {torneo.formato}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ✅ Modal para Crear Torneo */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <XCircle size={24} className="close-icon" onClick={cerrarModal} />
                        <h2>Crear Nuevo Torneo</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nombre del Torneo:</label>
                                <input 
                                    type="text" 
                                    value={nombre} 
                                    onChange={(e) => setNombre(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Modalidad:</label>
                                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} required>
                                    <option value="">-- Selecciona una modalidad --</option>
                                    <option value="OHB">OHB</option>
                                    <option value="HFA">HFA</option>
                                    <option value="HES">HES</option>
                                    <option value="AIC">AIC</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Formato:</label>
                                <select value={formato} onChange={(e) => setFormato(e.target.value)} required>
                                    <option value="">-- Selecciona un formato --</option>
                                    <option value="liga">Liga</option>
                                    <option value="eliminacion">Eliminación Directa</option>
                                    <option value="grupos_playoffs">Grupos + Playoffs</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-crear">Crear Torneo</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ MODAL PARA CONFIRMAR ELIMINACIÓN */}
            {showDeleteModal && torneoAEliminar && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>¿Estás seguro?</h2>
                        <p>¿Quieres eliminar el torneo <strong>{torneoAEliminar.nombre}</strong>? Esta acción no se puede deshacer.</p>
                        <div className="modal-buttons">
                            <button className="btn-confirmar" onClick={eliminarTorneo}>Sí, eliminar</button>
                            <button className="btn-cerrar" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Torneos;
