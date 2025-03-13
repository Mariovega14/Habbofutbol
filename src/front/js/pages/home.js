import React from "react";
import "../../styles/home.css";
import Hespng from "../../../../public/HES.png";
import HFApng from "../../../../public/HFA.png";
import AICpng from "../../../../public/AIC-logo.png";
import CBFpng from "../../../../public/cbf.png";
import logohf from "../../../../public/logohf.gif";

export const Home = () => {
  return (
    <>
      {/* Botones adicionales */}
      <div className="extra-buttons">
        <a href="/asistencia" className="extra-button">Presentes</a>
        <a href="/arbitraje" className="extra-button">Arbitraje</a>
      </div>
      
      <div className="home-container">
        <img src={logohf} alt="Habbofutbol" className="home-logo" />
        <h1 className="title">BIENVENIDO/A, SELECCIONA TU ROL</h1>
        <div className="grid-container">
        <a href="/aic" className="grid-item center-item">
            <img src={AICpng} alt="HFA Logo" className="grid-logo" />
          </a>
          <a href="/hfa" className="grid-item">
            <img src={HFApng} alt="HFA Logo" className="grid-logo" />
          </a>
          <a href="/hes" className="grid-item">
            <img src={Hespng} alt="HFA Logo" className="grid-logo" />
          </a>
		  <a href="/ohb" className="grid-item">
            <img src={CBFpng} alt="OHB Logo" className="grid-logo" />
          </a>
          
        </div>
      </div>
    </>
  );
};
