const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            token: localStorage.getItem("token") || null,
            role: localStorage.getItem("role") || null,
            jugadores: [],
            torneos: [],
            equipos: [],
            partidos: [],
            asistencias: [] ,// Nuevo estado para las asistencias
            tablaGoleadores: [],
            tablaAsistidores: [],
            tablaEquipos: [],
            torneoSeleccionado: null,
            tablaMvps: [],
    tablaMenciones: [],
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
            
                    const response = await fetch(`${process.env.BACKEND_URL}/jugadores/admin`, { // ✅ CORREGIDO
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
                        console.error("Error en createPlayerByAdmin:", data.error);
                        return { success: false, message: data.error || "Error desconocido" };
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
                    const token = localStorage.getItem("token"); // Obtener el token JWT
                    const response = await fetch(`${process.env.BACKEND_URL}/asistencia`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}` // Incluir el token
                        }
                    });
            
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
                    const resp = await fetch(`${process.env.BACKEND_URL}/jugadores`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
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
                    let formData = new FormData();
                    formData.append("nombre", datos.nombre);
                    formData.append("torneo_id", datos.torneo_id);
                    if (datos.logo) {
                        formData.append("logo", datos.logo);
                    }
            
                    const resp = await fetch(`${process.env.BACKEND_URL}/equipos`, {
                        method: "POST",
                        body: formData,
                    });
            
                    const data = await resp.json();
                    return { success: resp.ok, message: data.message || data.error };
                } catch (error) {
                    return { success: false, message: "Error al conectar con el servidor" };
                }
            },

            getEquiposConLogo: async () => {
                try {
                    const resp = await fetch(`${process.env.BACKEND_URL}/equipos-con-logo`);
                    const data = await resp.json();
                    if (resp.ok) {
                        setStore({ equipos: data });
                    } else {
                        console.error("Error al obtener equipos:", data);
                    }
                } catch (error) {
                    console.error("❌ Error al conectar con el servidor:", error);
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



            obtenerResumenes: async () => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + "/partidos");
                    if (!response.ok) throw new Error("Error al obtener los resúmenes");
            
                    const data = await response.json();
                    setStore({ partidos: data });
                } catch (error) {
                    console.error("Error al obtener los resúmenes:", error);
                }
            },
            
            
            

            getJugadoresPorEquipo: async (equipoId) => {
                try {
                    console.log("Solicitando jugadores para equipo ID:", equipoId);
            
                    const resp = await fetch(`${process.env.BACKEND_URL}/equipos/${equipoId}/jugadores`);
            
                    if (!resp.ok) {
                        throw new Error(`Error en la solicitud: ${resp.status}`);
                    }
            
                    // Usar `resp.clone().text()` para debug, pero sin consumir el stream
                    const respText = await resp.clone().text();
                    console.log("API Response (raw):", respText);
            
                    const data = await resp.json(); // Se llama solo una vez
                    console.log("Jugadores recibidos:", data);
            
                    return data.jugadores || [];
                } catch (error) {
                    console.error("Error al obtener jugadores del equipo:", error);
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
            },

            
            
            setTorneoSeleccionado: (torneo) => {
                console.log("📌 Torneo seleccionado:", torneo);
                setStore({ torneoSeleccionado: torneo });
            },

            // 📌 Obtener la tabla de goleadores por torneo
            getTablaGoleadoresPorTorneo: async (torneoId) => {
                try {
                    console.log(`⚽ Fetch tabla goleadores para Torneo ID: ${torneoId}`);
                    const response = await fetch(`${process.env.BACKEND_URL}/tablas/goleadores/${torneoId}`);
                    
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    
                    const data = await response.json();
                    console.log("✅ Tabla de goleadores recibida:", data);
                    setStore({ tablaGoleadores: data });

                } catch (error) {
                    console.error("❌ Error en getTablaGoleadoresPorTorneo:", error);
                }
            },

            // 📌 Obtener la tabla de asistidores por torneo
            getTablaAsistidoresPorTorneo: async (torneoId) => {
                try {
                    console.log(`🎯 Fetch tabla asistidores para Torneo ID: ${torneoId}`);
                    const response = await fetch(`${process.env.BACKEND_URL}/tablas/asistidores/${torneoId}`);
                    
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    
                    const data = await response.json();
                    console.log("✅ Tabla de asistidores recibida:", data);
                    setStore({ tablaAsistidores: data });

                } catch (error) {
                    console.error("❌ Error en getTablaAsistidoresPorTorneo:", error);
                }
            },

            // 📌 Obtener la tabla de posiciones por torneo
            getTablaEquiposPorTorneo: async (torneoId) => {
                try {
                    console.log(`📊 Fetch tabla posiciones para Torneo ID: ${torneoId}`);
                    const response = await fetch(`${process.env.BACKEND_URL}/tablas/posiciones/${torneoId}`);
                    
                    // 🔥 Verificar si la respuesta es HTML en lugar de JSON
                    const textResponse = await response.text();
                    console.log("📩 Respuesta recibida:", textResponse);
            
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
                    // Intentar parsear como JSON
                    const data = JSON.parse(textResponse);
                    console.log("✅ Tabla de posiciones recibida:", data);
                    setStore({ tablaEquipos: data });
            
                } catch (error) {
                    console.error("❌ Error en getTablaEquiposPorTorneo:", error);
                }
            },

            // 📌 Obtener torneos por modalidad
            getTorneosPorModalidad: async (modalidad) => {
                try {
                    console.log(`🔍 Fetch torneos para modalidad: ${modalidad}`);
                    const response = await fetch(`${process.env.BACKEND_URL}/torneos?modalidad=${modalidad}`);

                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    
                    const data = await response.json();
                    console.log("✅ Torneos recibidos:", data);
                    setStore({ torneos: data });

                } catch (error) {
                    console.error("❌ Error en getTorneosPorModalidad:", error);
                }
            },

            getTablaMvps: async () => {
                try {
                    console.log("🏆 Fetch tabla MVPs...");
                    const response = await fetch(`${process.env.BACKEND_URL}/tablas/mvps`);
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
                    const data = await response.json();
                    console.log("✅ Tabla MVPs recibida:", data);
                    setStore({ tablaMvps: data });
                } catch (error) {
                    console.error("Error en getTablaMvps:", error);
                }
            },
            
            getTablaMenciones: async () => {
                try {
                    console.log("🎖️ Fetch tabla menciones...");
                    const response = await fetch(`${process.env.BACKEND_URL}/tablas/menciones`);
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
                    const data = await response.json();
                    console.log("✅ Tabla de menciones recibida:", data);
                    setStore({ tablaMenciones: data });
                } catch (error) {
                    console.error("Error en getTablaMenciones:", error);
                }
            },
            
            
            



        }
    };
};

export default getState;
