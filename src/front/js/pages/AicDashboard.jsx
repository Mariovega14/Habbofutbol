import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/aictable.css";

const AicDashboard = () => {

    const navigate = useNavigate();

  return (
    <div className="aic-container">
      <header className="aic-header">
        <h1>🏆 AIC - Gestión de Torneos</h1>
      </header>

      <div className="aic-grid">
        <div className="aic-card aic-ranking">
          <h2>Ranking</h2>
          <p>Consulta las estadísticas de los jugadores y equipos.</p>
        </div>

        <div className="aic-card aic-foro">
          <h2>Foro</h2>
          <p>Discute estrategias y novedades con la comunidad.</p>
        </div>

        <div className="aic-card aic-convocatorias">
          <h2>Convocatorias</h2>
          <p>Publica y busca oportunidades para jugar en torneos.</p>
        </div>

        <div className="aic-card aic-equipos" onClick={() => navigate("/aic/equipos")}>
          <h2>Equipos</h2>
          <p>Gestiona los equipos participantes en cada torneo.</p>
        </div>
      </div>
    </div>
  );
};
export default AicDashboard;
