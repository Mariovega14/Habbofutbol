import React from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import "../../styles/hfatable.css"; // Importar el CSS específico para HFA

const HFADashboard = () => {
  const navigate = useNavigate(); // Crear instancia de navigate

  return (
    <div className="hfa-container">
      <header className="hfa-header">
        <h1>🏆 HFA - Gestión de Torneos</h1>
      </header>

      <div className="hfa-grid">
        <div className="hfa-card hfa-ranking">
          <h2>Ranking</h2>
          <p>Consulta las estadísticas de los jugadores y equipos.</p>
        </div>

        <div className="hfa-card hfa-foro">
          <h2>Foro</h2>
          <p>Discute estrategias y novedades con la comunidad.</p>
        </div>

        <div className="hfa-card hfa-convocatorias">
          <h2>Convocatorias</h2>
          <p>Publica y busca oportunidades para jugar en torneos.</p>
        </div>

        {/* Evento onClick para redirigir a /hfa/equipos */}
        <div className="hfa-card hfa-equipos" onClick={() => navigate("/hfa/equipos")}>
          <h2>Equipos</h2>
          <p>Gestiona los equipos participantes en cada torneo.</p>
        </div>
      </div>
    </div>
  );
};

export default HFADashboard;
