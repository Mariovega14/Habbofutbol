const getState = ({ getStore, getActions, setStore }) => {
    const secureFetch = async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!options.headers) options.headers = {};
        options.headers["Authorization"] = `Bearer ${token}`;

        try {
            const response = await fetch(url, options);

            if (response.status === 401 || response.status === 403) {
                getActions().logout(); // Cierra sesión automáticamente
                return { success: false, message: "Sesión expirada. Por favor, inicia sesión nuevamente." };
            }

            return response;
        } catch (error) {
            console.error("Error en secureFetch:", error);
            return { success: false, message: "Error de conexión con el servidor." };
        }
    };
    return {
        store: {
            token: localStorage.getItem("token") || null,
            role: localStorage.getItem("role") || null,
            jugadores: [],
            torneos: [],
            equipos: [],
            partidos: [],
            asistencias: [],// Nuevo estado para las asistencias
            tablaGoleadores: [],
            tablaAsistidores: [],
            tablaEquipos: [],
            torneoSeleccionado: null,
            tablaMvps: [],
            tablaMenciones: [],
            convocatorias: [],
            ofertas: [],
            playersWithRoles: [],
            ofertas: [],
            noticias: []
        },
        actions: {
            register: async (playerData) => {
                try {
                    // 1️⃣ Verificar que no haya campos vacíos
                    if (!playerData.name || !playerData.email || !playerData.password || !playerData.nickhabbo) {
                        return { success: false, message: "Todos los campos son obligatorios" };
                    }

                    // 2️⃣ Validar contraseña: 8 caracteres, mayúscula, minúscula, número
                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
                    if (!passwordRegex.test(playerData.password)) {
                        return {
                            success: false,
                            message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
                        };
                    }

                    // 3️⃣ Enviar solicitud al backend
                    const response = await fetch(`${process.env.BACKEND_URL}/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(playerData),
                    });

                    const data = await response.json();
                    console.log("Respuesta del backend:", data);

                    if (!response.ok) {
                        console.error("Error en register:", data.error);
                        return { success: false, message: data.error || "Error desconocido" };
                    }

                    return { success: true, message: "¡Registro exitoso! Redirigiendo..." };

                } catch (error) {
                    console.error("Error en register:", error);
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },



            crearTorneo: async (nombre, modalidad, formato) => {
                const store = getStore();

                // 🚨 Validar que el usuario sea admin antes de hacer la solicitud
                if (store.role !== "admin") {
                    console.error("Acceso denegado: el usuario no es administrador");
                    return { success: false, message: "No tienes permisos para crear un torneo" };
                }

                try {
                    const response = await secureFetch(`${process.env.BACKEND_URL}/torneos`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${store.token}`,
                        },
                        body: JSON.stringify({ nombre, modalidad, formato }),
                    });

                    const data = await response.json(); // Obtener respuesta en JSON

                    if (response.ok) {
                        await getActions().getTorneos(); // Refrescar la lista de torneos
                        return { success: true, message: "Torneo creado exitosamente" };
                    } else {
                        console.error("Error en crearTorneo:", data.error);
                        return { success: false, message: data.error || "Error desconocido" };
                    }
                } catch (error) {
                    console.error("Error en la petición:", error);
                    return { success: false, message: "Error en la conexión con el servidor" };
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

                    const response = await secureFetch(`${process.env.BACKEND_URL}/jugadores/noregistrados`, { // ✅ CORREGIDO
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,

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
                        localStorage.setItem("jugadorId", data.id);  // 🔹 Usa 'id' en lugar de 'jugador_id'

                        setStore({
                            token: data.token,
                            role: data.role,
                            jugadorId: data.id  // 🔹 Guarda correctamente en el store
                        });

                        return { success: true, message: "Inicio de sesión exitoso" };
                    } else {
                        return { success: false, message: data.message || "Credenciales incorrectas." };
                    }
                } catch (error) {
                    return { success: false, message: "Error de conexión con el servidor" };
                }
            },



            logout: () => {
                localStorage.clear(); // ✅ Borra todo lo almacenado

                setStore({ token: null, role: null, jugadorId: null });

                // Redirigir al usuario al login
                setTimeout(() => {
                    window.location.replace("/login");
                }, 500);
            },


            // 📌 Obtener asistencias
            obtenerAsistencias: async () => {
                try {
                    const token = localStorage.getItem("token"); // Obtener el token JWT
                    const response = await fetch(`${process.env.BACKEND_URL}/asistencia`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            // Incluir el token
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

                    const response = await secureFetch(`${process.env.BACKEND_URL}/jugadores/${playerId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,

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

                    const token = localStorage.getItem("token");

                    if (!token) {
                        return { success: false, message: "No tienes una sesión activa" };
                    }

                    const resp = await secureFetch(`${process.env.BACKEND_URL}/equipos`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        },
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
                    // 🔹 Obtener el token del usuario desde localStorage (o donde lo almacenes)
                    const token = localStorage.getItem("token");

                    if (!token) {
                        console.error("No tienes una sesión activa");
                        return false;
                    }

                    const response = await secureFetch(`${process.env.BACKEND_URL}/equipos/${equipoId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`  // ✅ Agregamos el token aquí
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
                    console.log("Intentando eliminar jugador del equipo:", { playerId, teamId }); // 🛠 Depuración

                    // 🔹 Obtener el token del usuario desde localStorage (o donde lo almacenes)
                    const token = localStorage.getItem("token");

                    if (!token) {
                        console.error("No tienes una sesión activa");
                        return { success: false, message: "No tienes una sesión activa" };
                    }

                    const response = await secureFetch(process.env.BACKEND_URL + "/remove_team", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`  // ✅ Se agrega el token JWT
                        },
                        body: JSON.stringify({ player_id: playerId, team_id: teamId })
                    });

                    if (!response.ok) throw new Error("Error al eliminar el jugador del equipo.");

                    const data = await response.json();
                    console.log("Jugador eliminado:", data); // 🛠 Depuración

                    getActions().getJugadores(); // Actualiza la lista de jugadores
                    return { success: true, data };
                } catch (error) {
                    console.error("Error al eliminar jugador del equipo:", error);
                    return { success: false, message: "Error al eliminar el jugador del equipo." };
                }
            },





            addPlayerToTeam: async (jugadorId, equipoId) => {
                try {
                    const token = localStorage.getItem("token"); // Obtener token JWT
                    const response = await fetch(`${process.env.BACKEND_URL}/players/add_team`, {
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

                    const response = await secureFetch(`${process.env.BACKEND_URL}/torneos/${torneoId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            // 🔐 Envía el token en la petición
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

                    const response = await secureFetch(`${process.env.BACKEND_URL}/jugadores/${playerId}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,

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
                    const response = await secureFetch(process.env.BACKEND_URL + "/partidos", {
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
                            "Authorization": `Bearer ${token}`,

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

            getConvocatorias: async (modalidad) => {
                try {
                    const { fetchWithAuth } = getActions(); // Obtener fetchWithAuth

                    // Llamada al backend con fetchWithAuth, el cual ya maneja la verificación del token
                    const data = await fetchWithAuth(`${process.env.BACKEND_URL}/convocatorias/${modalidad}`);

                    if (!data) throw new Error("Error al obtener convocatorias");

                    // Si la respuesta es válida, actualizamos el store con las convocatorias
                    setStore({ convocatorias: data });
                } catch (error) {
                    console.error("❌ Error en getConvocatorias:", error);
                    // Si hay error (por ejemplo, token expirado o problema con la API), limpiamos el store de convocatorias
                    setStore({ convocatorias: [] });
                }
            },


            crearConvocatoria: async (jugadorId, mensaje, modalidad) => {
                try {
                    const { fetchWithAuth } = getActions(); // 🔹 Acceder a fetchWithAuth correctamente

                    const data = await fetchWithAuth(`${process.env.BACKEND_URL}/jugador/crear_convocatoria`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jugador_id: jugadorId, mensaje, modalidad })
                    });

                    if (!data) throw new Error("Error al crear la convocatoria");

                    alert("Convocatoria creada con éxito.");
                    getActions().getConvocatorias(modalidad); // 🔹 Recargar convocatorias
                    return { success: true };

                } catch (error) {
                    console.error("❌ Error en crearConvocatoria:", error);
                    return { success: false };
                }
            },



            getOfertas: async (jugadorId, modalidad) => {
                try {
                    if (!jugadorId || !modalidad) return { success: false };

                    const response = await fetch(`${process.env.BACKEND_URL}/jugador/${jugadorId}/ofertas/${modalidad}`);
                    const data = await response.json();

                    if (!response.ok) throw new Error(data.error || "Error al obtener ofertas");

                    setStore({ ofertas: data });
                } catch (error) {
                    setStore({ ofertas: [] }); // Limpiar en caso de error
                    return { success: false };
                }
            },

            enviarOferta: async (dtId, jugadorId, equipoId) => {
                try {
                    if (!dtId || !jugadorId || !equipoId) return { success: false };

                    const response = await fetch(process.env.BACKEND_URL + "/dt/ofertar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dt_id: dtId, jugador_id: jugadorId, equipo_id: equipoId })
                    });

                    const data = await response.json();

                    if (!response.ok) throw new Error(data.error);

                    alert("Oferta enviada con éxito.");
                    return { success: true, data };
                } catch (error) {
                    return { success: false };
                }
            },

            aceptarOferta: async (ofertaId, jugadorId, modalidad) => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + "/jugador/aceptar_oferta", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ oferta_id: ofertaId })
                    });

                    const data = await response.json();

                    if (!response.ok) throw new Error(data.error || "Error al aceptar la oferta");

                    alert("Oferta aceptada correctamente.");
                    getActions().getOfertas(jugadorId, modalidad);
                    getActions().getConvocatorias(modalidad);

                    return { success: true, data };
                } catch (error) {
                    return { success: false };
                }
            },

            eliminarConvocatoria: async (convocatoriaId, modalidad) => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/jugador/eliminar_convocatoria/${convocatoriaId}`, {
                        method: "DELETE"
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Error al eliminar la convocatoria");
                    }

                    alert("Convocatoria eliminada con éxito.");
                    getActions().getConvocatorias(modalidad); // Recargar después de eliminar
                } catch (error) {
                    alert(error.message); // Mostrar mensaje de error
                }
            },


            getEquiposPorDT: async (dtId) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        throw new Error("No hay token disponible. Por favor, inicia sesión nuevamente.");
                    }

                    const role = localStorage.getItem("role");
                    if (!role || role.toLowerCase() !== "dt") {
                        throw new Error("No tienes permisos para acceder a esta información.");
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/equipos/dt/${dtId}`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Error al obtener los equipos: ${response.status}`);
                    }

                    const data = await response.json();
                    return data;
                } catch (error) {
                    alert(error.message); // Mostrar mensaje de error al usuario
                    return []; // Retornar un arreglo vacío en caso de error
                }
            },

            getPlayersWithRoles: async () => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(process.env.BACKEND_URL + "/jugadores/roles", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,

                        }
                    });

                    if (!response.ok) throw new Error("Error al obtener los jugadores");

                    const data = await response.json();
                    console.log("✅ Jugadores obtenidos:", data); // 👀 Ver qué llega

                    setStore({ playersWithRoles: data });

                } catch (error) {
                    console.error("❌ Error al obtener jugadores con roles:", error);
                }
            },

            // Cambiar rol de un usuario
            updatePlayerRole: async (playerId, newRole) => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`${process.env.BACKEND_URL}/jugadores/rol`, { // 🔥 URL corregida
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,

                        },
                        body: JSON.stringify({ id: playerId, role: newRole }) // ✅ El backend espera un objeto con "id" y "role"
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || "Error desconocido");

                    console.log("✅ Rol actualizado:", result);

                    getActions().getPlayersWithRoles(); // 🔄 Refrescar lista después de actualizar
                } catch (error) {
                    console.error("❌ Error al actualizar rol:", error);
                }
            },

            obtenerNoticias: async () => {
                try {
                    const response = await fetch(`${process.env.BACKEND_URL}/noticias`);
                    if (!response.ok) throw new Error("Error al obtener noticias");
                    const data = await response.json();
                    setStore({ noticias: data });
                } catch (error) {
                    console.error("Error al obtener noticias:", error);
                }
            },

            crearNoticia: async (titulo, contenido, imagen) => {
                try {
                    let formData = new FormData();
                    formData.append("titulo", titulo);
                    formData.append("contenido", contenido);
                    if (imagen) {
                        formData.append("imagen", imagen);
                    }

                    const token = localStorage.getItem("token");

                    if (!token) {
                        return { success: false, message: "No tienes una sesión activa" };
                    }

                    const response = await fetch(`${process.env.BACKEND_URL}/noticias`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        },
                        body: formData,
                    });

                    const data = await response.json();
                    return { success: response.ok, message: data.message || data.error, imagen_url: data.imagen_url };

                } catch (error) {
                    return { success: false, message: "Error al conectar con el servidor" };
                }
            },

            editarNoticia: async (id, titulo, contenido, imagenUrl) => {
                try {
                    const token = localStorage.getItem("token"); // 🔹 Obtiene el token
                    const response = await fetch(`${process.env.BACKEND_URL}/noticias/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`  // 🔹 Agrega el token aquí
                        },
                        body: JSON.stringify({ titulo, contenido, imagenUrl })
                    });
                    if (!response.ok) throw new Error("Error al editar noticia");

                    getActions().obtenerNoticias();
                } catch (error) {
                    console.error("Error al editar noticia:", error);
                }
            },

            eliminarNoticia: async (id) => {
                try {
                    const token = localStorage.getItem("token"); // 🔹 Obtiene el token
                    const response = await fetch(`${process.env.BACKEND_URL}/noticias/${id}`, {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`  // 🔹 Agrega el token aquí
                        }
                    });
                    if (!response.ok) throw new Error("Error al eliminar noticia");

                    getActions().obtenerNoticias();
                } catch (error) {
                    console.error("Error al eliminar noticia:", error);
                }
            },

            fetchWithAuth: async (url, options = {}) => {
                try {
                    const token = localStorage.getItem("token");

                    if (!token) {
                        getActions().logout();
                        return null;
                    }

                    options.headers = {
                        ...options.headers,
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    };

                    const response = await fetch(url, options);

                    if (response.status === 401) {
                        console.warn("🔹 Token expirado. Cerrando sesión...");
                        getActions().logout();
                        return null;
                    }

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Error en la petición");

                    return data;
                } catch (error) {
                    console.error("❌ Error en fetchWithAuth:", error);
                    return null;
                }
            },







        }
    };
};

export default getState;