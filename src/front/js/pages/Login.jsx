import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/login.css";

const Login = () => {
    const { actions } = useContext(Context);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { success, message } = await actions.login(email, password);

        if (success) {
            Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Inicio de sesión exitoso.",
                timer: 1300,
                showConfirmButton: false,
            });
            navigate("/");
        } else {
            Swal.fire({
                icon: "error",
                title: "Error de inicio de sesión",
                text: message,
            });
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="login-title">Iniciar Sesión</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="login-input"
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="login-input"
                    />
                    <button type="submit" className="login-button">Ingresar</button>
                </form>
                <p className="register-text">
                    ¿Aún no tienes cuenta? <span onClick={() => navigate("/register")}>Regístrate aquí</span>
                </p>
            </div>
        </div>
    );
};

export default Login;