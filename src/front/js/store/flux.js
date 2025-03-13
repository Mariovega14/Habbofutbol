const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            token: localStorage.getItem("token") || null,
            role: localStorage.getItem("role") || null,
            jugadores: [],
            torneos: [],
            equipos: [],
            partidos: [],
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
                        setStore({ asistencias: data.reverse() });

                    } else {
                        console.error("Error al obtener asistencias:", data.message);
                    }
                } catch (error) {
                    console.error("Error al obtener asistencias:", error);
                }
            },

            getJugadores: async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        console.error("No hay token disponible");
                        return;
                    }

                    const resp = await fetch(`${process.env.BACKEND_URL}/admin/players`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!resp.ok) {
                        const errorData = await resp.json().catch(() => ({})); // Manejar errores en JSON
                        console.error(`Error al obtener los jugadores: ${resp.status} - ${errorData.error || "Error desconocido"}`);
                        setStore({ jugadores: [] });
                        return;
                    }

                    const data = await resp.json();
                    setStore({ jugadores: data || [] });

                } catch (error) {
                    console.error("Error en getJugadores:", error);
                    setStore({ jugadores: [] });
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
                        return { success: true, message: "Registrada Correctamente" };
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

            removePlayerFromTeam: async (playerId, teamId) => {
                try {
                    console.log("Intentando eliminar equipo:", { playerId, teamId }); // 🛠 Depuración
            
                    const response = await fetch(process.env.BACKEND_URL + "/remove_team", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ player_id: playerId, team_id: teamId })
                    });
            
                    if (!response.ok) throw new Error("Error al eliminar el equipo.");
            
                    const data = await response.json();
                    console.log("Equipo eliminado:", data); // 🛠 Depuración
            
                    getActions().getJugadores(); // Actualiza la lista de jugadores
                    return data;
                } catch (error) {
                    console.error("Error al eliminar equipo:", error);
                }
            },
            
            


            addPlayerToTeam: async (jugadorId, equipoId) => {
                try {
                    const token = localStorage.getItem("token"); // Obtener token JWT
                    const response = await fetch(`${process.env.BACKEND_URL}/admin/players/add_team`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            jugador_id: jugadorId,
                            equipo_id: equipoId
                        }),
                    });
            
                    const data = await response.json();
            
                    if (!response.ok) {
                        throw new Error(data.error || "Error al añadir jugador al equipo");
                    }
            
                    alert("Jugador añadido correctamente");
                    return data;
                } catch (error) {
                    console.error("Error al añadir jugador al equipo:", error);
                    alert("Error al añadir jugador");
                }
            },
                        



            eliminarTorneo: async (torneoId) => {
                try {
                    const token = localStorage.getItem("token"); // 🔐 Obtén el token de autenticación
                    if (!token) {
                        console.error("No hay token disponible");
                        return false;
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/torneos/${torneoId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // 🔐 Envía el token en la petición
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Error al eliminar el torneo');
                    }

                    console.log(`Torneo ${torneoId} eliminado correctamente`);
                    getActions().getTorneos(); // Recargar la lista de torneos

                    return true;
                } catch (error) {
                    console.error('Error:', error);
                    return false;
                }
            }, 

            
            deletePlayer: async (playerId) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        return { success: false, message: "No estás autenticado" };
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/jugadores/${playerId}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    const data = await response.json();
                    console.log("Respuesta del servidor:", data);

                    if (!response.ok) {
                        console.error("Error en deletePlayer:", data.message);
                        return { success: false, message: data.message || "Error desconocido" };
                    }

                    return { success: true, message: "Jugador eliminado correctamente" };

                } catch (error) {
                    console.error("Error en deletePlayer:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },

            registrarPartido: async (partidoData) => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + "/partidos", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: JSON.stringify(partidoData),
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Error al registrar el partido");

                    console.log("Partido registrado con éxito:", data);
                    return { success: true, message: "Partido registrado correctamente" };
                } catch (error) {
                    console.error("Error al registrar el partido:", error);
                    return { success: false, message: error.message };
                }
            },


            getEquiposPorTorneo: async (torneoId) => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + `/equipos/torneo/${torneoId}`);
                    if (!response.ok) throw new Error("Error al obtener los equipos");
                    const data = await response.json();
                    setStore({ equipos: data });
                    return data;
                } catch (error) {
                    console.error("Error al cargar los equipos del torneo:", error);
                    return [];
                }
            },


            registrarPartido: async (partidoData) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) throw new Error("No hay token disponible");

                    console.log("📤 Enviando datos al backend:", JSON.stringify(partidoData, null, 2));

                    const response = await fetch(process.env.BACKEND_URL + "/partidos", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(partidoData)  // 🔥 Asegurar que se envía como JSON
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("❌ Error del backend:", errorData);
                        throw new Error(errorData.error || "Error al registrar el partido");
                    }

                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error("❌ Error al registrar el partido:", error);
                    return { success: false, message: error.message };
                }
            },




            getPartidos: async () => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + "/partidos");
                    if (!response.ok) throw new Error("Error al obtener los partidos");
                    const data = await response.json();
                    setStore({ partidos: data });
                    return data;
                } catch (error) {
                    console.error("Error al cargar los partidos:", error);
                    return [];
                }
            },

            getJugadoresPorEquipo: async (equipoId) => {
                try {
                    console.log("Solicitando jugadores para equipo:", equipoId);
                    const response = await fetch(process.env.BACKEND_URL + `/equipos/${equipoId}/jugadores`);
                    if (!response.ok) throw new Error("Error al obtener los jugadores");

                    const data = await response.json();
                    console.log("Jugadores recibidos:", data); // Verifica en consola

                    setStore({ jugadores: data });
                    return data;
                } catch (error) {
                    console.error("Error al cargar los jugadores del equipo:", error);
                    return [];
                }
            },

            obtenerEquiposPorModalidad: async (modalidad) => {
                try {
                    const resp = await fetch(`${process.env.BACKEND_URL}/${modalidad}/equipos`);
                    if (!resp.ok) throw new Error("Error al obtener los equipos");

                    const data = await resp.json();
                    setStore({ equipos: data });
                } catch (error) {
                    console.error("Error:", error);
                }
            }



        }
    };
};

export default getState;
