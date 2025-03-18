import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/register.css";

const Register = () => {
    const { actions } = useContext(Context);
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "", nickhabbo: "", role: "jugador" });

    const handleChange = ({ target }) => setForm(prev => ({ ...prev, [target.name]: target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const { success, message } = await actions.register(form);
    
        Swal.fire({
            icon: success ? "success" : "error",
            title: success ? "¡Registro Exitoso!" : "Error en el Registro",
            text: message,  // 👈 Mostramos el mensaje del backend
            confirmButtonColor: success ? "#3085d6" : "#d33",
        });
    
        if (success) {
            setForm({ name: "", email: "", password: "", nickhabbo: "", role: "jugador" });
            setTimeout(() => navigate("/login"), 2000);
        }
    };
    

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Registro</h2>
                <form onSubmit={handleSubmit}>
                    {["name", "email", "password"].map((field) => (
                        <input 
                            key={field} 
                            type={field === "email" ? "email" : field === "password" ? "password" : "text"} 
                            name={field} 
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)} 
                            onChange={handleChange} 
                            required 
                        />
                    ))}
                    <input 
                        type="text" 
                        name="nickhabbo" 
                        placeholder="Nick Habbo" 
                        onChange={handleChange} 
                        required 
                    />
                    <button type="submit">Registrarse</button>
                </form>
                <p className="login-text">
                    ¿Ya tienes cuenta? <span onClick={() => navigate("/login")}>Inicia aquí</span>
                </p>
            </div>
        </div>
    );
};

export default Register;
