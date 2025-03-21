import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";
import Register from "./pages/Register.jsx"
import Attendance from "./pages/Attendance.jsx"
import AdminDashboard from "./pages/Admindashboard.jsx"
import AdminJugadores from "./pages/AdminJugadores.jsx"
import Hestable from "./pages/Hestable.jsx"
import AicDashboard from "./pages/AicDashboard.jsx"
import OhbDashboard from "./pages/OhbDashboard.jsx"
import RegistroPartido from "./pages/RegistroPartido.jsx";
import HFADashboard from "./pages/HfaDashboard.jsx";
import Equipos from "./pages/Equipos.jsx"
import CrearTorneo from "./pages/CrearTorneo.jsx"
import Roles from "./pages/Roles.jsx"
import Login from "./pages/Login.jsx"
import EquiposModalidad from "./component/EquiposModalidad.jsx";
import Rankings from "./component/Rankings.jsx";
import { Home } from "./pages/home";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import injectContext from "./store/appContext";
import ResumenesPartidos from "./component/Resumenes.jsx"; 

import { Navbar } from "./component/navbar";
import OfertarJugador from "./component/OfertarJugador.jsx";
import Noticias from "./pages/Noticias.jsx"




//create your first component
const Layout = () => {
    //the basename is used when your project is published in a subdirectory and not in the root of the domain
    // you can set the basename on the .env file located at the root of this project, E.g: BASENAME=/react-hello-webapp/
    const basename = process.env.BASENAME || "";

    if(!process.env.BACKEND_URL || process.env.BACKEND_URL == "") return <BackendURL/ >;

    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar />
                    <Routes>
                        <Route element={<Home />} path="/" />
                        <Route element={<Register />} path="/register" />
                        <Route element={<Login />} path="/login" />
                        <Route element={<Attendance />} path="/asistencia" />
                        <Route element={<RegistroPartido />} path="/arbitraje" />
                        <Route element={<AdminDashboard />} path="/admin" />
                        <Route element={<AdminJugadores />} path="/admin/jugadores" />
                        <Route element={<CrearTorneo />} path="/admin/torneos" />
                        <Route element={<Equipos />} path="/admin/equipos" />
                        <Route element={<Roles />} path="/admin/roles" />
                        <Route element={<Hestable />} path="/hes" />
                        <Route element={<AicDashboard />} path="/aic" />
                        <Route element={<HFADashboard />} path="/hfa" />
                        <Route element={<OhbDashboard />} path="/ohb" />
                        <Route element={<Noticias />} path="/noticias" />
                        <Route element={<ResumenesPartidos />} path="/:modalidad/resumenes" />
                        <Route element={<Rankings />} path="/:modalidad/rankings" />
                        <Route element={<EquiposModalidad />} path="/:modalidad/equipos" />
                        <Route element={<OfertarJugador />} path="/:modalidad/convocatorias" />
                        <Route element={<Demo />} path="/demo" />
                        <Route element={<Single />} path="/single/:theid" />
                        <Route element={<h1>Not found!</h1>} />
                    </Routes>
                
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);