import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ohbtable.css";

const OhbDashboard = () => {

const navigate = useNavigate();

  return (
    <div className="ohb-container">
      <header className="ohb-header">
        <h1>🏆 OHB - Gestão de Torneios</h1>
      </header>

      <div className="ohb-grid">
        <div className="ohb-card ohb-ranking">
          <h2>Ranking</h2>
          <p>Consulte as estatísticas dos jogadores e equipes.</p>
        </div>

        <div className="ohb-card ohb-foro">
          <h2>Fórum</h2>
          <p>Discuta estratégias e novidades com a comunidade.</p>
        </div>

        <div className="ohb-card ohb-convocatorias">
          <h2>Convocatórias</h2>
          <p>Publique e encontre oportunidades para jogar torneios.</p>
        </div>

        <div className="ohb-card ohb-equipos" onClick={() => navigate("/ohb/equipos")}>
          <h2>Equipes</h2>
          <p>Gerencie as equipes participantes em cada torneio.</p>
        </div>
        </div>
        </div>
  );
};
export default OhbDashboard;
