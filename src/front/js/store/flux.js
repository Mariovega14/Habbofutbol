const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            token: localStorage.getItem("token") || null,
            role: localStorage.getItem("role") || null,
            jugadores: [],
            jugadoresEquipo: [],
            torneos: [],
            equipos: [],
            asistencias: [] // Nuevo estado para las asistencias
        },
        actions: {
            register: async (playerData) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(playerData),
                    });

                    const data = await response.json();
                    console.log("Respuesta del backend:", data);

                    if (!response.ok) {
                        console.error("Error en register:", data.message);
                        return { success: false, message: data.message || "Error desconocido" };
                    }

                    return { success: true, message: data.message };

                } catch (error) {
                    console.error("Error en register:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            crearTorneo: async (nombre, modalidad, formato) => {
                const store = getStore();
                const response = await fetch(`${process.env.BACKEND_URL}/torneos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${store.token}`,
                    },
                    body: JSON.stringify({ nombre, modalidad, formato }),
                });

                if (response.ok) {
                    await getActions().getTorneos(); // Refrescar la lista de torneos
                    return true;
                } else {
                    return false;
                }
            },

            getTorneos: async () => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/torneos`);
                    const data = await response.json();

                    if (response.ok) {
                        setStore({ torneos: data });
                    } else {
                        console.error("Error al obtener los torneos:", data.message);
                    }
                } catch (error) {
                    console.error("Error en getTorneos:", error);
                }
            },



            createPlayerByAdmin: async (nickhabbo) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        return { success: false, message: "No estás autenticado" };
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/jugadores/admin`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ nickhabbo }),
                    });

                    const data = await response.json();
                    console.log("Respuesta del servidor:", data); // Depuración

                    if (!response.ok) {
                        console.error("Error en createPlayerByAdmin:", data.message);
                        return { success: false, message: data.message || "Error desconocido" };
                    }

                    return { success: true, message: "Jugador creado correctamente" };

                } catch (error) {
                    console.error("Error en createPlayerByAdmin:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            login: async (email, password) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        localStorage.setItem("token", data.token);
                        localStorage.setItem("role", data.role);
                        setStore({ token: data.token, role: data.role });
                        return { success: true, message: "Inicio de sesión exitoso" };
                    } else {
                        return { success: false, message: data.message || "Credenciales incorrectas." };
                    }
                } catch (error) {
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            logout: () => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                setStore({ token: null, role: null });
                window.location.href = "/";
            },

            // 📌 Obtener asistencias
            obtenerAsistencias: async () => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/asistencia`);
                    const data = await response.json();

                    if (response.ok) {
                        setStore({ asistencias: data.reverse() }); // Ordenamos de más reciente a más antigua
                    } else {
                        console.error("Error al obtener asistencias:", data.message);
                    }
                } catch (error) {
                    console.error("Error al obtener asistencias:", error);
                }
            },

            getJugadores: async () => { // Cambiado de "getPlayers" a "getJugadores"
                try {
                    const token = localStorage.getItem("token"); // Obtener el token de autenticación
                    if (!token) {
                        console.error("No hay token disponible");
                        return;
                    }

                    const resp = await fetch(process.env.BACKEND_URL + "/admin/players", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`, // Incluir el token en la petición
                        },
                    });

                    if (!resp.ok) {
                        console.error("Error al obtener los jugadores");
                        return;
                    }

                    const data = await resp.json();
                    setStore({ jugadores: data || [] }); // Cambiado de "players" a "jugadores"
                } catch (error) {
                    console.error("Error en getJugadores:", error);
                    setStore({ jugadores: [] }); // En caso de error, inicializa jugadores como un array vacío
                }
            },

            updatePlayerNick: async (playerId, newNick) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        return { success: false, message: "No estás autenticado" };
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/jugadores/${playerId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ nickhabbo: newNick }),
                    });

                    const data = await response.json();
                    console.log("Respuesta del servidor:", data); // Depuración

                    if (!response.ok) {
                        console.error("Error en updatePlayerNick:", data.message);
                        return { success: false, message: data.message || "Error desconocido" };
                    }

                    return { success: true, message: "NickHabbo actualizado correctamente" };

                } catch (error) {
                    console.error("Error en updatePlayerNick:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            // 📌 Registrar asistencia
            registrarAsistencia: async (nombre) => {
                if (!nombre.trim()) {
                    return { success: false, message: "Debes ingresar un nombre" };
                }

                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/asistencia`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nombre }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        getActions().obtenerAsistencias(); // Refrescamos la lista después de registrar
                        return { success: true, message: "Asistencia registrada correctamente" };
                    } else {
                        return { success: false, message: data.message || "No se pudo registrar la asistencia" };
                    }
                } catch (error) {
                    console.error("Error al registrar asistencia:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            crearEquipo: async (datos) => {
                try {
                    const resp = await fetch(`${process.env.BACKEND_URL}/equipos`, {
                        method: "POST",
                        body: JSON.stringify(datos),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    const data = await resp.json();
                    return { success: resp.ok, message: data.message };
                } catch (error) {
                    return { success: false, message: "Error al conectar con el servidor" };
                }
            },

            getEquipos: async () => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/equipos`);
                    const data = await response.json();

                    if (response.ok) {
                        setStore({ equipos: data });
                    } else {
                        console.error("Error al obtener los equipos:", data.message);
                    }
                } catch (error) {
                    console.error("Error en getEquipos:", error);
                }
            },

            eliminarEquipo: async (equipoId) => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + `/equipos/${equipoId}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });

                    if (!response.ok) {
                        throw new Error("Error al eliminar el equipo");
                    }

                    return true;
                } catch (error) {
                    console.error("Error:", error);
                    return false;
                }
            },

            eliminarEquipo: async (equipoId) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/equipos/${equipoId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Error al eliminar el equipo');
                    }

                    return true;
                } catch (error) {
                    console.error('Error:', error);
                    return false;
                }
            },

            getJugadoresPorEquipo: async (equipoId) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/equipos/${equipoId}/jugadores`);
                    if (!response.ok) throw new Error('Error al obtener jugadores');
                    const data = await response.json();

                    set({ jugadoresEquipo: data });
                    return { success: true };
                } catch (error) {
                    console.error(error);
                    return { success: false };
                }
            },

            agregarJugadorAEquipo: async (equipoId, jugadorId) => {
                try {
                  const response = await fetch(`${process.env.BACKEND_URL}/equipos/${equipoId}/jugadores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jugador_id: jugadorId }),
                  });
              
                  if (response.ok) {
                    // Recargar jugadores del equipo después de agregar
                    await getActions().getJugadoresPorEquipo(equipoId);
                    return { success: true };
                  } else {
                    return { success: false };
                  }
                } catch (error) {
                  console.error('Error agregando jugador al equipo:', error);
                  return { success: false };
                }
              },
              
              eliminarJugadorDeEquipo: async (equipoId, jugadorId) => {
                try {
                  const response = await fetch(`${process.env.BACKEND_URL}/equipos/${equipoId}/jugadores/${jugadorId}`, {
                    method: 'DELETE',
                  });
              
                  if (response.ok) {
                    // Recargar jugadores del equipo después de eliminar
                    await getActions().getJugadoresPorEquipo(equipoId);
                    return { success: true };
                  } else {
                    return { success: false };
                  }
                } catch (error) {
                  console.error('Error eliminando jugador del equipo:', error);
                  return { success: false };
                }
            },
        }
    };
};

export default getState;
