Habbofutbol - Plataforma de Gestión de Torneos de Fútbol

Descripción General

Habbofutbol es una plataforma web Full Stack diseñada para gestionar de manera integral torneos de fútbol. Permite la creación y gestión de torneos, equipos y jugadores, así como la gestión del mercado de jugadores, la generación de reportes de partidos por árbitros, la visualización de rankings y tablas de goleadores, y la gestión de roles. El sistema está construido con un backend robusto en Python y Flask, y un frontend dinámico y responsivo en React.js.

Funcionalidades Principales

Gestión de Torneos:

Creación de nuevos torneos con detalles como nombre, fechas y reglas.
Gestión de equipos participantes en cada torneo.

Gestión de Equipos y Jugadores:
Creación y edición de equipos con información detallada.
Gestión de jugadores con detalles como nombre, posición y estadísticas.
Gestion del mercado de jugadores.

Gestión de Partidos y Reportes:
Generación de reportes de partidos por árbitros.
Visualización de resultados y estadísticas de partidos.

Rankings y Tablas:
Visualización de rankings de equipos y tablas de goleadores, asistencias, etc.

Gestión de Roles:
Gestion de roles de usuarios como arbitros, directores tecnicos, administradores etc.

Gestión de Imágenes:
Uso de Cloudinary para la gestión eficiente de las imágenes de jugadores y equipos.

Autenticación y Autorización:
Implementación de JWT para la seguridad de la aplicación.

Gestión de estados:
Implementación de redux para la gestión de estados de la app en react.

Tecnologías Utilizadas

Backend:

Python

Flask

SQLAlchemy

JWT

Frontend:

React.js

HTML5

CSS3

Bootstrap

Otros:

Cloudinary

Redux

Railway (base de datos)

EC2 AWS (backend)

Vercel (frontend)

Instalación

Clona el repositorio: git clone https://github.com/dserodio?tab=repositories
Instala las dependencias del backend: pip install -r requirements.txt
Instala las dependencias del frontend: npm install
Configura la base de datos en Railway y las variables de entorno para EC2 AWS y Vercel.
Despliega el backend en EC2 AWS: sigue las instrucciones de configuración de AWS.
Despliega el frontend en Vercel: sigue las instrucciones de configuración de Vercel.
Uso
Accede a la aplicación a través de tu navegador con
https://www.habbofutbol.com

Utiliza las funcionalidades de gestión de torneos, equipos, jugadores y partidos según sea necesario.

Para la gestión de las imagenes de los jugadores y equipos dirijase a cloudinary para la configuracion.

Contribución

¡Las contribuciones son bienvenidas! Si encuentras un error o tienes una sugerencia de mejora, por favor, abre un issue o envía un pull request.
