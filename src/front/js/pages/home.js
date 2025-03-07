import React, { useContext, useState } from "react";
import "../../styles/home.css";
import HFAImage from "../../../../public/HFA.webp"
import HFApng from "../../../../public/HFA.png"
import AICpng from "../../../../public/AIC-logo.png"

export const Home = () => {
	
  
	return (
		<div className="home-container">
		<h1 className="title">Bienvenido Selecciona tu rol</h1>
		<div className="grid-container">
		  <a href="/hfa" className="grid-item">
		  <img src={HFAImage} alt="HFA Logo" className="grid-logo" />
		  </a>
		  <a href="/ohb" className="grid-item">
		  <img src={HFApng} alt="HFA Logo" className="grid-logo" />
		  </a>
		  <a href="/hes" className="grid-item center-item">
		  <img src={AICpng} alt="HFA Logo" className="grid-logo" />
		  </a>
		</div>
	  </div>
	);
  };
