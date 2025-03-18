import React, { useEffect, useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useParams } from "react-router-dom";
import "../../styles/convocatorias.css";

const ConvocatoriasYOfertas = () => {
    const { store, actions } = useContext(Context);
    const { modalidad } = useParams(); // Capturar modalidad desde la URL
    const modalidadNormalizada = modalidad.toUpperCase(); // Convertir a mayúsculas
    const [jugadorId, setJugadorId] = useState(null);
    const [equipos, setEquipos] = useState([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1); // Paginación
    const [searchTerm, setSearchTerm] = useState(""); // Filtro de búsqueda
    const itemsPerPage = 20; // Número de convocatorias por página

    // Cargar jugadorId desde localStorage
    useEffect(() => {
        const storedJugadorId = localStorage.getItem("jugadorId");
        if (storedJugadorId) {
            setJugadorId(storedJugadorId);
        }
    }, []);

    // Cargar equipos si el usuario es DT
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

    // Cargar convocatorias de la modalidad actual
    useEffect(() => {
        if (!jugadorId || !modalidadNormalizada) return;

        console.log("📌 Obteniendo convocatorias para modalidad:", modalidadNormalizada);

        setLoading(true);
        actions.getConvocatorias(modalidadNormalizada)
            .then(response => console.log("📌 Convocatorias recibidas:", response))
            .catch(error => console.error("❌ Error obteniendo convocatorias:", error))
            .finally(() => setLoading(false));
    }, [jugadorId, modalidadNormalizada]);

    // Cargar ofertas para el jugador
    useEffect(() => {
        if (!jugadorId || !modalidadNormalizada) {
            console.error("🚨 No se puede obtener ofertas: jugadorId o modalidad indefinidos.", { jugadorId, modalidadNormalizada });
            return;
        }
    
        actions.getOfertas(jugadorId, modalidadNormalizada)
            .catch(error => console.error("❌ Error obteniendo ofertas:", error));
    }, [jugadorId, modalidadNormalizada]); 

    // Crear una convocatoria
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

    // Enviar una oferta
    const handleOfertar = (jugadorId) => {
        const dtId = localStorage.getItem("jugadorId");
        if (!dtId) {
            console.error("❌ Error: No se encontró el ID del DT.");
            return;
        }

        if (!equipoSeleccionado) {
            console.error("❌ Error: No se ha seleccionado un equipo.");
            return;
        }

        actions.enviarOferta(dtId, jugadorId, equipoSeleccionado)
            .then(() => console.log("✅ Oferta enviada correctamente"))
            .catch((error) => console.error("❌ Error enviando oferta:", error));
    };

    // Aceptar una oferta
    const handleAceptarOferta = async (ofertaId) => {
        await actions.aceptarOferta(ofertaId);
        actions.getOfertas(jugadorId, modalidadNormalizada);
    };

    // Filtrar convocatorias por nickhabbo
    const filteredConvocatorias = store.convocatorias.filter(conv =>
        conv.nickhabbo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginación: Obtener convocatorias para la página actual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConvocatorias = filteredConvocatorias.slice(indexOfFirstItem, indexOfLastItem);

    // Cambiar de página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <p className="habbo-loading">Cargando...</p>;

    return (
        <div className="habbo-convocatorias-container">
            <h2 className="habbo-title">Convocatorias - {modalidadNormalizada}</h2>

            {/* Formulario para crear convocatorias */}
            <div className="habbo-form-container">
                <h3 className="habbo-subtitle">Crear Convocatoria</h3>
                <form onSubmit={handleCrearConvocatoria}>
                    <textarea
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        required
                        className="habbo-textarea"
                    />
                    <button type="submit" className="habbo-button habbo-button-primary">Publicar</button>
                </form>
            </div>

            {/* Filtro de búsqueda */}
            <div className="habbo-search-container">
                <input
                    type="text"
                    placeholder="Buscar por nickhabbo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="habbo-search-input"
                />
            </div>

            {/* Lista de Convocatorias */}
            <div className="habbo-convocatorias-list">
                <h2 className="habbo-subtitle">Convocatorias</h2>
                {currentConvocatorias.length > 0 ? (
                    currentConvocatorias.map(conv => (
                        <div key={conv.id} className="habbo-card">
                            <p className="habbo-card-text"><strong>{conv.nickhabbo}:</strong> {conv.mensaje}</p>
                            {equipos.length > 0 && (
                                <div className="habbo-card-actions">
                                    <label className="habbo-label">Selecciona un equipo:</label>
                                    <select
                                        value={equipoSeleccionado}
                                        onChange={(e) => setEquipoSeleccionado(e.target.value)}
                                        className="habbo-select"
                                    >
                                        {equipos.map((equipo) => (
                                            <option key={equipo.id} value={equipo.id}>
                                                {equipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleOfertar(conv.jugador_id)} className="habbo-button habbo-button-secondary">Enviar Oferta</button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="habbo-no-data">No hay convocatorias disponibles.</p>
                )}

                {/* Paginación */}
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

            {/* Lista de Ofertas Recibidas */}
            <div className="habbo-ofertas-list">
                <h2 className="habbo-subtitle">Ofertas Recibidas</h2>
                {store.ofertas.length > 0 ? (
                    store.ofertas.map(oferta => (
                        <div key={oferta.id} className="habbo-card">
                            <p className="habbo-card-text">Oferta de {oferta.dt_nombre} para {oferta.equipo_nombre}</p>
                            <button onClick={() => handleAceptarOferta(oferta.id)} className="habbo-button habbo-button-success">Aceptar Oferta</button>
                        </div>
                    ))
                ) : (
                    <p className="habbo-no-data">No tienes ofertas pendientes.</p>
                )}
            </div>
        </div>
    );
};

export default ConvocatoriasYOfertas;