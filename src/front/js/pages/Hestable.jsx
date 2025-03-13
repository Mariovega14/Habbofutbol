import React from "react";
import "../../styles/hestable.css";
import { useNavigate } from "react-router-dom";

const HesDashboard = () => {
  
  const navigate = useNavigate();

  return (
    <div className="hes-container">
      <header className="hes-header">
        <h1>🏆 HES - Gestión de Torneos</h1>
      </header>

      <div className="hes-grid">
        <div className="hes-card hes-ranking">
          <h2>Ranking</h2>
          <p>Consulta las estadísticas de los jugadores y equipos.</p>
        </div>

        <div className="hes-card hes-foro">
          <h2>Foro</h2>
          <p>Discute estrategias y novedades con la comunidad.</p>
        </div>

        <div className="hes-card hes-convocatorias">
          <h2>Convocatorias</h2>
          <p>Publica y busca oportunidades para jugar en torneos.</p>
        </div>

        <div className="hes-card hes-equipos" onClick={() => navigate("/hes/equipos")}>
          <h2>Equipos</h2>
          <p>Gestiona los equipos participantes en cada torneo.</p>
        </div>
      </div>
    </div>
  );
};
export default HesDashboard;
