import React, { useContext, useState, useEffect } from "react";
import { Context } from "../store/appContext";
import "../../styles/noticias.css";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';

const Noticias = () => {
    const { store, actions } = useContext(Context);
    const [nuevaNoticia, setNuevaNoticia] = useState({ titulo: "", contenido: "", imagen: null });
    const [noticiaActiva, setNoticiaActiva] = useState(null);
    const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

    useEffect(() => {
        actions.obtenerNoticias();
    }, []);

    const handleChange = (e) => {
        setNuevaNoticia({ ...nuevaNoticia, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setNuevaNoticia({ ...nuevaNoticia, imagen: e.target.files[0] });
    };

    const handleCrearNoticia = async () => {
        const response = await actions.crearNoticia(nuevaNoticia.titulo, nuevaNoticia.contenido, nuevaNoticia.imagen);
        if (response.success) {
            alert("Noticia creada con éxito");
            setNuevaNoticia({ titulo: "", contenido: "", imagen: null });
            setMostrarModalCrear(false);
        } else {
            alert(response.message);
        }
    };

    const handleEliminarNoticia = (id) => {
        if (confirm("¿Estás seguro de eliminar esta noticia?")) {
            actions.eliminarNoticia(id);
        }
    };

    return (
        <div className="noticias-wrapper">
            <div className="noticias-container">
                <h2 className="noticias-titulo">📰 Últimas Noticias</h2>

                {(store?.role === "admin" || store?.role === "superadmin") && (
                    <button className="btn-crear-noticia" onClick={() => setMostrarModalCrear(true)}>+ Crear Noticia</button>
                )}

                <div className="noticias-grid">
                    {store?.noticias?.length > 0 ? (
                        store.noticias.map((noticia) => (
                            <div key={noticia.id} className="noticia-preview-card" onClick={() => setNoticiaActiva(noticia)}>
                                <h4>{noticia.titulo}</h4>
                                {store.role === "admin" && (
                                    <button className="btn-eliminar" onClick={(e) => {
                                        e.stopPropagation();
                                        handleEliminarNoticia(noticia.id);
                                    }}>
                                        🗑 Eliminar
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No hay noticias disponibles.</p>
                    )}
                </div>

                {/* Modal para VER noticia */}
                {noticiaActiva && (
                    <div className="modal-overlay" onClick={() => setNoticiaActiva(null)}>
                        <div className="modal-carta ver" onClick={(e) => e.stopPropagation()}>
                            <span className="modal-cerrar" onClick={() => setNoticiaActiva(null)}>&times;</span>
                            <h3>{noticiaActiva.titulo}</h3>
                            <div
                                className="noticia-contenido"
                                dangerouslySetInnerHTML={{ __html: noticiaActiva.contenido }}
                            ></div>
                            {noticiaActiva.imagen_url && <img src={noticiaActiva.imagen_url} alt="noticia" />}
                        </div>
                    </div>
                )}

                {/* Modal para CREAR noticia */}
                {mostrarModalCrear && (
                    <div className="modal-overlay" onClick={() => setMostrarModalCrear(false)}>
                        <div className="modal-carta crear" onClick={(e) => e.stopPropagation()}>
                            <span className="modal-cerrar" onClick={() => setMostrarModalCrear(false)}>&times;</span>
                            <h3>Nueva Noticia</h3>
                            <input type="text" name="titulo" placeholder="Título" value={nuevaNoticia.titulo} onChange={handleChange} />

                            <ReactQuill
                                className="editor-noticia"
                                theme="snow"
                                value={nuevaNoticia.contenido}
                                onChange={(value) => setNuevaNoticia({ ...nuevaNoticia, contenido: value })}
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'align': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'image'],
                                        ['clean']
                                    ]
                                }}
                                placeholder="Escribe el contenido aquí..."
                            />

                            <input type="file" accept="image/*" onChange={handleFileChange} />
                            <button onClick={handleCrearNoticia}>Publicar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Noticias;
