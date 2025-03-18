import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Trophy, Users, BarChart2, UserCheck } from "lucide-react";
import "../../styles/admindashboard.css";

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const stats = [
        { title: "Torneos Activos", value: 5, icon: <Trophy className="stat-icon stat-yellow" /> },
        { title: "Usuarios Registrados", value: 120, icon: <Users className="stat-icon stat-blue" /> },
        { title: "Partidos Jugados", value: 45, icon: <BarChart2 className="stat-icon stat-green" /> },
    ];

    const navButtons = [
        { label: "🏆 Torneos", route: "/admin/torneos" },
        { label: "⚽ Equipos", route: "/admin/equipos" },
        { label: "👥 Jugadores", route: "/admin/jugadores" },
        { label: "🔑 Gestión de Roles", route: "/admin/roles" },
    ];

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <h2 className="logo-text">⚡ Admin Panel</h2>
                    <X className="close-icon" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />
                </div>
                <nav className="sidebar-nav">
                    {navButtons.map((btn, index) => (
                        <button key={index} className="nav-btn" onClick={() => navigate(btn.route)}>
                            {btn.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Overlay para móviles */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

            {/* Contenido Principal */}
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1 className="dashboard-title">📊 Dashboard</h1>
                    <Menu className="menu-icon" aria-label="Abrir menú" onClick={() => setSidebarOpen(true)} />
                </header>

                {/* Botones de navegación rápida */}
                <section className="quick-navigation">
                    {navButtons.map((btn, index) => (
                        <button key={index} onClick={() => navigate(btn.route)} className="quick-btn">
                            {btn.label}
                        </button>
                    ))}
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
