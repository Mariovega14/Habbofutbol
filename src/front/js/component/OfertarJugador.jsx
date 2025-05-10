import React, { useEffect, useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useParams } from "react-router-dom";
import "../../styles/convocatorias.css";

const ConvocatoriasYOfertas = () => {
    const { store, actions } = useContext(Context);
    const { modalidad } = useParams();
    const modalidadNormalizada = modalidad.toUpperCase();
    const [jugadorId, setJugadorId] = useState(null);
    const [equipos, setEquipos] = useState([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 20;
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalOfertas, setMostrarModalOfertas] = useState(false);

    useEffect(() => {
        const storedJugadorId = localStorage.getItem("jugadorId");
        if (storedJugadorId) setJugadorId(storedJugadorId);
    }, []);

    useEffect(() => {
        if (!jugadorId || !modalidadNormalizada) return;

        const role = localStorage.getItem("role");
        if (role && role.toLowerCase() === "dt") {
            setLoading(true);
            actions.getEquiposPorDT(jugadorId)
                .then((equipos) => {
                    setEquipos(equipos);
                    if (equipos.length > 0) {
                        setEquipoSeleccionado(equipos[0].id);
                    }
                })
                .catch((error) => console.error("Error obteniendo equipos:", error))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [jugadorId, modalidadNormalizada]);

    useEffect(() => {
        if (!jugadorId || !modalidadNormalizada) return;

        setLoading(true);
        actions.getConvocatorias(modalidadNormalizada)
            .finally(() => setLoading(false));
    }, [jugadorId, modalidadNormalizada]);

    useEffect(() => {
        if (!jugadorId || !modalidadNormalizada) return;

        actions.getOfertas(jugadorId, modalidadNormalizada)
            .catch(error => console.error("❌ Error obteniendo ofertas:", error));
    }, [jugadorId, modalidadNormalizada]);

    const handleCrearConvocatoria = async (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return alert("El mensaje no puede estar vacío.");

        try {
            await actions.crearConvocatoria(jugadorId, mensaje, modalidadNormalizada);
            setMensaje("");
            await actions.getConvocatorias(modalidadNormalizada);
        } catch (error) {
            console.error("❌ Error al crear la convocatoria:", error);
        }
    };

    const handleOfertar = (jugadorId) => {
        const dtId = localStorage.getItem("jugadorId");
        if (!dtId || !equipoSeleccionado) return;

        actions.enviarOferta(dtId, jugadorId, equipoSeleccionado)
            .catch((error) => console.error("❌ Error enviando oferta:", error));
    };

    const handleAceptarOferta = async (ofertaId) => {
        await actions.aceptarOferta(ofertaId);
        actions.getOfertas(jugadorId, modalidadNormalizada);
    };

    const handleEliminarConvocatoria = async (convocatoriaId) => {
        const confirmar = window.confirm("¿Estás segura de eliminar esta convocatoria?");
        if (!confirmar) return;

        try {
            await actions.eliminarConvocatoria(convocatoriaId, modalidadNormalizada);
        } catch (error) {
            console.error("Error eliminando la convocatoria:", error);
        }
    };

    const filteredConvocatorias = store.convocatorias.filter(conv =>
        conv.nickhabbo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConvocatorias = filteredConvocatorias.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <p className="habbo-loading">
                {jugadorId ? "Cargando..." : "Debe iniciar sesión para ver este apartado..."}
            </p>
        );
    }


    return (
        <div className="habbo-convocatorias-container">
            <h2 className="habbo-title">Convocatorias - {modalidadNormalizada}</h2>

            <div className="habbo-header-buttons">
                <button className="habbo-button habbo-button-primary" onClick={() => setMostrarModal(true)}>
                    + Crear Convocatoria
                </button>

                <button className="habbo-button habbo-button-success" onClick={() => setMostrarModalOfertas(true)}>
                    Ver Ofertas Recibidas
                </button>
            </div>

            <div className="habbo-search-container">
                <input
                    type="text"
                    placeholder="Buscar por nickhabbo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="habbo-search-input"
                />
            </div>

            <div className="habbo-convocatorias-list">
                <h2 className="habbo-subtitle">Convocatorias</h2>
                {currentConvocatorias.length > 0 ? (
                    <div className="habbo-cards-grid">
                        {currentConvocatorias.map(conv => (
                            <div key={conv.id} className="habbo-card">
                                <p className="habbo-card-text">
                                    <strong>{conv.nickhabbo}:</strong> {conv.mensaje}
                                </p>

                                {/* Mostrar botón eliminar si es admin */}
                                {localStorage.getItem("role") === "admin" && (
                                    <div className="habbo-admin-actions">
                                        <button
                                            className="habbo-button habbo-button-danger"
                                            onClick={() => handleEliminarConvocatoria(conv.id)}
                                        >
                                            🗑 Eliminar
                                        </button>
                                    </div>
                                )}

                                {equipos.length > 0 && (
                                    <div className="habbo-card-actions">
                                        <label className="habbo-label">Equipo:</label>
                                        <select
                                            value={equipoSeleccionado}
                                            onChange={(e) => setEquipoSeleccionado(e.target.value)}
                                            className="habbo-select"
                                        >
                                            {equipos.map((equipo) => (
                                                <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleOfertar(conv.jugador_id)}
                                            className="habbo-button habbo-button-secondary"
                                        >
                                            Enviar Oferta
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="habbo-no-data">No hay convocatorias disponibles.</p>
                )}

                <div className="habbo-pagination">
                    {Array.from({ length: Math.ceil(filteredConvocatorias.length / itemsPerPage) }).map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={`habbo-button ${currentPage === index + 1 ? "habbo-button-active" : ""}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {mostrarModal && (
                <div className="habbo-modal-overlay">
                    <div className="habbo-modal">
                        <h3 className="habbo-subtitle">Crear Convocatoria</h3>
                        <form onSubmit={(e) => { handleCrearConvocatoria(e); setMostrarModal(false); }}>
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                required
                                className="habbo-textarea"
                            />
                            <div className="habbo-modal-actions">
                                <button type="submit" className="habbo-button habbo-button-primary">Publicar</button>
                                <button type="button" className="habbo-button habbo-button-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalOfertas && (
                <div className="habbo-modal-overlay">
                    <div className="habbo-modal">
                        <h3 className="habbo-subtitle">Ofertas Recibidas</h3>
                        {store.ofertas.length > 0 ? (
                            <div className="habbo-ofertas-grid">
                                {store.ofertas.map(oferta => (
                                    <div key={oferta.id} className="habbo-card">
                                        <p className="habbo-card-text">Oferta de <strong>{oferta.dt_nombre}</strong> para <strong>{oferta.equipo_nombre}</strong></p>
                                        <button
                                            onClick={() => { handleAceptarOferta(oferta.id); setMostrarModalOfertas(false); }}
                                            className="habbo-button habbo-button-success"
                                        >Aceptar Oferta</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="habbo-no-data">No tienes ofertas pendientes.</p>
                        )}
                        <div className="habbo-modal-actions">
                            <button
                                onClick={() => setMostrarModalOfertas(false)}
                                className="habbo-button habbo-button-secondary"
                            >Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConvocatoriasYOfertas;
