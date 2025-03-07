import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Trophy, Users, BarChart2 } from "lucide-react";
import "../../styles/admindashboard.css";

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
  
    const stats = [
      { title: "Torneos Activos", value: 5, icon: <Trophy className="icon yellow" /> },
      { title: "Usuarios Registrados", value: 120, icon: <Users className="icon blue" /> },
      { title: "Partidos Jugados", value: 45, icon: <BarChart2 className="icon green" /> },
    ];
  
    return (
      <div className="dashboard">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h2>Admin Panel</h2>
            <X className="close-icon" onClick={() => setSidebarOpen(false)} />
          </div>
          <nav>
            <button className="nav-button" onClick={() => navigate("/admin/torneos")}>🏆 Torneos</button>
            <button className="nav-button" onClick={() => navigate("/admin/equipos")}>⚽ Equipos</button>
            <button className="nav-button" onClick={() => navigate("/admin/jugadores")}>👥 Jugadores</button>
          </nav>
        </div>
  
        {/* Overlay para móviles */}
        {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}
  
        {/* Contenido principal */}
        <div className="content">
          <div className="topbar">
            <h1>Dashboard</h1>
            <Menu className="menu-icon" onClick={() => setSidebarOpen(true)} />
          </div>
  
          {/* Botones de navegación rápida */}
          <div className="quick-nav">
            <button onClick={() => navigate("/admin/torneos")} className="quick-button">🏆 Torneos</button>
            <button onClick={() => navigate("/admin/equipos")} className="quick-button">⚽ Equipos</button>
            <button onClick={() => navigate("/admin/jugadores")} className="quick-button">👥 Jugadores</button>
          </div>
  
          {/* Estadísticas */}
          <div className="stats-container">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                {stat.icon}
                <div>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-title">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default AdminDashboard;