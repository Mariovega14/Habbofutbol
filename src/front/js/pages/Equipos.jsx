import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import "../../styles/equipos.css";

const Equipos = () => {
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();

  const [ligaFiltro, setLigaFiltro] = useState("");
  const [modalidadFiltro, setModalidadFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [torneoId, setTorneoId] = useState("");
  const [logo, setLogo] = useState(null);

  // ✅ Estado para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipoAEliminar, setEquipoAEliminar] = useState(null);

  useEffect(() => {
    actions.getTorneos();
    actions.getEquipos();
  }, []);

  const equiposFiltrados = store.equipos.filter((equipo) => {
    const torneo = store.torneos.find((t) => t.id === equipo.torneo_id);
    if (!torneo) return false;

    const coincideLiga = ligaFiltro ? torneo.nombre === ligaFiltro : true;
    const coincideModalidad = modalidadFiltro ? torneo.modalidad === modalidadFiltro : true;
    const coincideBusqueda = busqueda ? equipo.nombre.toLowerCase().includes(busqueda.toLowerCase()) : true;

    return coincideLiga && coincideModalidad && coincideBusqueda;
  });

  // ✅ Mostrar modal de confirmación para eliminar equipo
  const confirmarEliminacion = (equipo) => {
    setEquipoAEliminar(equipo);
    setShowDeleteModal(true);
  };

  // ✅ Eliminar equipo después de confirmación
  const eliminarEquipo = async () => {
    if (equipoAEliminar) {
      const resultado = await actions.eliminarEquipo(equipoAEliminar.id);
      if (resultado) {
        actions.getEquipos(); // Refrescar lista
      }
      setShowDeleteModal(false);
      setEquipoAEliminar(null);
    }
  };

  // ✅ Crear equipo
  const handleCrearEquipo = async () => {
    const datosEquipo = {
        nombre: nombreEquipo.trim(), // Elimina espacios innecesarios
        torneo_id: torneoId,
        logo: logo // Agregar el archivo de imagen si está seleccionado
    };

    console.log("Datos enviados al backend:", datosEquipo); // Debug

    if (!datosEquipo.nombre || !datosEquipo.torneo_id) {
        console.error("Datos incorrectos:", datosEquipo);
        return;
    }

    const resultado = await actions.crearEquipo(datosEquipo); // ✅ CORREGIDO
    console.log("Resultado:", resultado);

    if (resultado.success) {
        setShowEquipoModal(false); // Cerrar modal si se crea exitosamente
        actions.getEquipos(); // Recargar lista de equipos
    } else {
        alert(resultado.message); // Mostrar mensaje de error
    }
};


  return (
    <div className="equipos-container">
      <header className="equipos-header">
        <h1>Lista de Equipos</h1>
        <div className="admin-buttons">
          <button onClick={() => navigate("/admin/torneos")}>Torneos</button>
          <button onClick={() => navigate("/admin/jugadores")}>Jugadores</button>
        </div>
      </header>

      <div className="filtros-container">
        <select onChange={(e) => setLigaFiltro(e.target.value)} value={ligaFiltro}>
          <option value="">Filtrar por Liga</option>
          {store.torneos.map((torneo) => (
            <option key={torneo.id} value={torneo.nombre}>
              {torneo.nombre}
            </option>
          ))}
        </select>
        <select onChange={(e) => setModalidadFiltro(e.target.value)} value={modalidadFiltro}>
          <option value="">Filtrar por Modalidad</option>
          <option value="OHB">OHB</option>
          <option value="HFA">HFA</option>
          <option value="HES">HES</option>
        </select>
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="crear-equipo">
        <button onClick={() => setShowEquipoModal(true)}>+ Agregar Equipo</button>
      </div>

      <div className="tabla-container">
        <table className="tabla-equipos">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Liga</th>
              <th>Modalidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equiposFiltrados.length > 0 ? (
              equiposFiltrados.map((equipo) => {
                const torneo = store.torneos.find((t) => t.id === equipo.torneo_id);
                return (
                  <tr key={equipo.id}>
                    <td>{equipo.nombre}</td>
                    <td>{torneo ? torneo.nombre : "Desconocido"}</td>
                    <td>{torneo ? torneo.modalidad : "Desconocido"}</td>
                    <td>
                      <button className="btn-eliminar-equipo" onClick={() => confirmarEliminacion(equipo)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4">No hay equipos registrados con esos filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL PARA CONFIRMAR ELIMINACIÓN */}
      {showDeleteModal && equipoAEliminar && (
        <div className="modal">
          <div className="modal-content">
            <h2>¿Estás seguro?</h2>
            <p>¿Quieres eliminar el equipo <strong>{equipoAEliminar.nombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={eliminarEquipo}>Sí, eliminar</button>
              <button className="btn-cerrar" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL PARA CREAR EQUIPO */}
      {showEquipoModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Agregar Nuevo Equipo</h2>
            <input
              type="text"
              placeholder="Nombre del equipo"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
            />
            <select onChange={(e) => setTorneoId(e.target.value)} value={torneoId}>
              <option value="">Seleccionar Torneo</option>
              {store.torneos.map((torneo) => (
                <option key={torneo.id} value={torneo.id}>
                  {torneo.nombre} - {torneo.modalidad}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files[0])}
            />
            <div className="modal-buttons">
              <button className="btn-guardar" onClick={handleCrearEquipo}>Guardar</button>
              <button className="btn-cerrar" onClick={() => setShowEquipoModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipos;
