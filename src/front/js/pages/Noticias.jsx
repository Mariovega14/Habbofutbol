import React, { useContext, useState, useEffect } from "react";
import { Context } from "../store/appContext";
import "../../styles/noticias.css";

const Noticias = () => {
    const { store, actions } = useContext(Context);
    const [nuevaNoticia, setNuevaNoticia] = useState({ titulo: "", contenido: "", imagen: null });
    const [editando, setEditando] = useState(null);

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
        } else {
            alert(response.message);
        }
    };

    const handleEliminarNoticia = (id) => {
        actions.eliminarNoticia(id);
    };

    const handleGuardarEdicion = (id) => {
        actions.editarNoticia(id, nuevaNoticia);
        setEditando(null);
        setNuevaNoticia({ titulo: "", contenido: "", imagen: null });
    };

    return (
        <div className="noticias-container">
            <h1 className="noticias-titulo">Últimas Noticias</h1>

            {/* ✅ FORMULARIO PARA CREAR NOTICIA */}
            {store?.role && (store.role === "admin" || store.role === "superadmin") && (
                <div className="noticias-form">
                    <input
                        type="text"
                        name="titulo"
                        placeholder="Título"
                        value={nuevaNoticia.titulo}
                        onChange={handleChange}
                    />
                    <textarea
                        name="contenido"
                        placeholder="Contenido"
                        value={nuevaNoticia.contenido}
                        onChange={handleChange}
                    ></textarea>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button onClick={handleCrearNoticia}>Crear Noticia</button>
                </div>
            )}

            {/* ✅ LISTADO DE NOTICIAS */}
            <div className="noticias-lista">
                {store?.noticias && store.noticias.length > 0 ? (
                    store.noticias.map((noticia) => (
                        <div key={noticia.id} className="noticia">
                            {editando === noticia.id ? (
                                <div className="noticia-editar">
                                    <input type="text" name="titulo" value={nuevaNoticia.titulo} onChange={handleChange} />
                                    <textarea name="contenido" value={nuevaNoticia.contenido} onChange={handleChange}></textarea>
                                    <input type="file" accept="image/*" onChange={handleFileChange} />
                                    <button onClick={() => handleGuardarEdicion(noticia.id)}>Guardar</button>
                                </div>
                            ) : (
                                <div className="noticia-card">
                                    <h2>{noticia.titulo}</h2>
                                    <div className="noticia-contenido" dangerouslySetInnerHTML={{ __html: noticia.contenido.replace(/\n/g, "<br>") }}></div>
                                    {noticia.imagen_url && (
                                        <img src={noticia.imagen_url} alt={noticia.titulo} className="noticia-imagen" onError={(e) => console.log("Error cargando imagen", e)} />
                                    )}
                                    {store.role === "admin" && (
                                        <div className="noticia-buttons">
                                            <button onClick={() => handleEliminarNoticia(noticia.id)}>Eliminar</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="noticias-mensaje">No hay noticias disponibles.</p>
                )}
            </div>
        </div>
    );
};

export default Noticias;
