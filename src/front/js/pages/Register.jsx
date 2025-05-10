import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/register.css";

const Register = () => {
    const { actions } = useContext(Context);
    const navigate = useNavigate();

    const initialForm = {
        name: "",
        email: "",
        password: "",
        nickhabbo: "",
        role: "jugador"
    };

    const [form, setForm] = useState(initialForm);
    const [passwordValid, setPasswordValid] = useState(true);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    const handleChange = ({ target }) => {
        const { name, value } = target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (name === "password") {
            setPasswordValid(passwordRegex.test(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email.includes("@")) {
            return Swal.fire({
                icon: "error",
                title: "Correo inválido",
                text: "Por favor ingresa un correo electrónico válido",
            });
        }

        if (!passwordValid) {
            return Swal.fire({
                icon: "error",
                title: "Contraseña inválida",
                text: "La contraseña no cumple con los requisitos mínimos.",
            });
        }

        const { success, message } = await actions.register(form);

        await Swal.fire({
            icon: success ? "success" : "error",
            title: success ? "¡Registro Exitoso!" : "Error en el Registro",
            text: message,
            confirmButtonColor: success ? "#3085d6" : "#d33",
        });

        if (success) {
            setForm(initialForm);
            navigate("/login");
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Registro</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    {!passwordValid && (
                        <div className="password-warning">
                            La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.
                        </div>
                    )}
                    <input
                        type="text"
                        name="nickhabbo"
                        placeholder="Nombre de usuario en Habbo"
                        value={form.nickhabbo}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={!passwordValid}>Registrarse</button>
                </form>

                <p className="login-text">
                    ¿Ya tienes cuenta? <span onClick={() => navigate("/login")}>Inicia aquí</span>
                </p>
            </div>
        </div>
    );
};

export default Register;
