// --- NUEVO ARCHIVO: public/libreria/js/model/api-proxy.mjs ---

/**
 * Función helper para manejar las peticiones fetch,
 * parsear JSON y controlar errores de HTTP.
 */
const http = async (url, options = {}) => {
	// Añadimos 'Content-Type' por defecto si hay un 'body'
	if (options.body) {
		options.headers = {
			"Content-Type": "application/json",
			...options.headers,
		};
	}

	try {
		const response = await fetch(url, options);

		// Si la respuesta es 204 (No Content), no hay JSON que parsear.
		if (response.status === 204) {
			return { success: true, data: null };
		}

		// Parseamos la respuesta JSON (sea éxito o error de la API)
		const data = await response.json();

		// Si la respuesta HTTP no fue 'ok' (ej. 404, 500), lanzamos un error
		if (!response.ok) {
			throw new Error(data.error || "Error en la petición a la API");
		}

		// Si la respuesta HTTP fue 'ok', devolvemos los datos
		return data; // Esto será { success: true, usuario: ... } o un array [libro1, libro2]
	} catch (error) {
		// Capturamos errores de red (ej. servidor caído) o el error lanzado arriba
		console.error(`Error en fetch a ${url}:`, error);
		// Devolvemos un formato de error unificado que los componentes puedan entender
		return { success: false, error: error.message };
	}
};

/**
 * Este es el "Proxy".
 * Es el único objeto que los componentes del cliente (Vistas/Presenters)
 * importarán para interactuar con el backend.
 */
export const api = {
	// ===============================================
	// API DE LIBROS
	// ===============================================
	getLibros: async () => {
		return http("/api/libros");
	},
	getLibroById: async (id) => {
		return http(`/api/libros/${id}`);
	},
	addLibro: async (libroData) => {
		// libroData es un objeto: { titulo, autor, isbn, precio, stock }
		return http("/api/libros", {
			method: "POST",
			body: JSON.stringify(libroData),
		});
	},
	updateLibro: async (id, libroData) => {
		return http(`/api/libros/${id}`, {
			method: "PUT",
			body: JSON.stringify(libroData),
		});
	},
	deleteLibro: async (id) => {
		return http(`/api/libros/${id}`, {
			method: "DELETE",
		});
	},

	// ===============================================
	// API DE AUTENTICACIÓN Y USUARIOS
	// ===============================================

	/**
	 * Inicia sesión para un Cliente o un Admin.
	 * El 'rol' determina a qué endpoint de la API llamar.
	 */
	iniciarSesion: async (usuario, password, rol) => {
		const rutaBase =
			rol.toUpperCase() === "ADMIN" ? "/api/admins" : "/api/clientes";
		return http(`${rutaBase}/autenticar`, {
			method: "POST",
			body: JSON.stringify({ usuario, password }), // Solo enviamos lo que pide la API
		});
	},

	/**
	 * Registra un nuevo usuario. En P1, esto siempre crea un CLIENTE.
	 */
	registrar: async (datosRegistro) => {
		// datosRegistro es { dni, nombre, apellidos, direccion, telefono, email, password }
		return http("/api/clientes", {
			method: "POST",
			body: JSON.stringify(datosRegistro),
		});
	},

	/**
	 * Actualiza el perfil de un usuario (Admin o Cliente).
	 */
	updateUsuario: async (rol, id, datosUsuario) => {
		const rutaBase =
			rol.toUpperCase() === "ADMIN" ? "/api/admins" : "/api/clientes";
		return http(`${rutaBase}/${id}`, {
			method: "PUT",
			body: JSON.stringify(datosUsuario),
		});
	},

	// ===============================================
	// API DE FACTURAS/COMPRAS
	// ===============================================

	/**
	 * Obtiene las compras (Facturas) de un cliente.
	 */
	getCompras: async (clienteId) => {
		return http(`/api/facturas?cliente=${clienteId}`);
	},

	/**
	 * Procesa un pago, creando una nueva Factura en el servidor.
	 * El 'pagoData' debe contener: { items, total, usuarioId, envio }
	 */
	realizarPago: async (pagoData) => {
		return http("/api/facturas", {
			method: "POST",
			body: JSON.stringify(pagoData),
		});
	},

	// ===============================================
	// API DE CARRO
	// ===============================================
	// NOTA: Esta sección es un gran cambio con respecto a P1,
	// que usaba localStorage.
	// Ahora el carro vive en el servidor.

	getCarro: async (clienteId) => {
		return http(`/api/clientes/${clienteId}/carro`);
	},
	addCarroItem: async (clienteId, item) => {
		// item es { libroId, cantidad }
		return http(`/api/clientes/${clienteId}/carro/items`, {
			method: "POST",
			body: JSON.stringify(item),
		});
	},
	updateCarroItem: async (clienteId, index, cantidad) => {
		return http(`/api/clientes/${clienteId}/carro/items/${index}`, {
			method: "PUT",
			body: JSON.stringify({ cantidad }),
		});
	},
	// (Podrías necesitar añadir un 'deleteCarroItem' en app.mjs y aquí)
};