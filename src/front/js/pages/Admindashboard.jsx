import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Trophy, Users, BarChart2 } from "lucide-react";
import "../../styles/admindashboard.css"; // ✅ Estilos personalizados

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
  
    const stats = [
        { title: "Torneos Activos", value: 5, icon: <Trophy className="stat-icon stat-yellow" /> },
        { title: "Usuarios Registrados", value: 120, icon: <Users className="stat-icon stat-blue" /> },
        { title: "Partidos Jugados", value: 45, icon: <BarChart2 className="stat-icon stat-green" /> },
    ];
  
    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <h2 className="logo-text">⚡ Admin Panel</h2>
                    <X className="close-icon" onClick={() => setSidebarOpen(false)} />
                </div>
                <nav className="sidebar-nav">
                    <button className="nav-btn" onClick={() => navigate("/admin/torneos")}>🏆 Torneos</button>
                    <button className="nav-btn" onClick={() => navigate("/admin/equipos")}>⚽ Equipos</button>
                    <button className="nav-btn" onClick={() => navigate("/admin/jugadores")}>👥 Jugadores</button>
                </nav>
            </aside>

            {/* Overlay para móviles */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

            {/* Contenido Principal */}
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1 className="dashboard-title">📊 Dashboard</h1>
                    <Menu className="menu-icon" onClick={() => setSidebarOpen(true)} />
                </header>

                {/* Botones de navegación rápida */}
                <section className="quick-navigation">
                    <button onClick={() => navigate("/admin/torneos")} className="quick-btn">🏆 Torneos</button>
                    <button onClick={() => navigate("/admin/equipos")} className="quick-btn">⚽ Equipos</button>
                    <button onClick={() => navigate("/admin/jugadores")} className="quick-btn">👥 Jugadores</button>
                </section>

                {/* Sección de estadísticas */}
                <section className="stats-section">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            {stat.icon}
                            <div className="stat-info">
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-title">{stat.title}</p>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
