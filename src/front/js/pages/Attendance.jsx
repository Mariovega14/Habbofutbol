import React, { useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";
import { Context } from "../store/appContext";
import { CheckCircle, UserPlus, CalendarDays } from "lucide-react";
import "../../styles/attendance.css";

const Attendance = () => {
    const { actions, store } = useContext(Context);
    const [nombre, setNombre] = useState("");
    const [esAdmin, setEsAdmin] = useState(false);

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setEsAdmin(userRole === "admin");
        actions.obtenerAsistencias();
    }, []);

    const registrarAsistencia = async () => {
        if (!nombre.trim()) {
            Swal.fire("Error", "Debes ingresar un nombre", "error");
            return;
        }

        const resultado = await actions.registrarAsistencia(nombre);

        if (resultado.success) {
            Swal.fire("Éxito", resultado.message, "success");
            setNombre("");
        } else {
            Swal.fire("Error", resultado.message, "error");
        }
    };

    return (
        <div className="attendance-container">
            <h2 className="attendance-title">Registro de Asistencia</h2>
            <div className="attendance-input-container">
                <UserPlus className="input-icon" size={20} color="#007bff" />
                <input
                    type="text"
                    className="attendance-input"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
                <button className="attendance-button" onClick={registrarAsistencia}>
                    <CheckCircle size={18} /> Marcar Presente
                </button>
            </div>

            <h3 className="attendance-subtitle">Asistencias Registradas</h3>
            <div className="attendance-table-container">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th><UserPlus size={16} /> Nombre</th>
                            <th><CalendarDays size={16} /> Fecha y Hora</th>
                            {esAdmin && <th>IP</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {store.asistencias.map((asistencia) => (
                            <tr key={asistencia.id}>
                                <td>{asistencia.nombre}</td>
                                <td>{asistencia.fecha_hora}</td>
                                {esAdmin && <td>{asistencia.ip}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Attendance;
