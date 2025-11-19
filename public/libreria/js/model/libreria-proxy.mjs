const resolveBaseUrl = () => {
	if (typeof window === "undefined") {
		return "http://localhost:3000/api";
	}

	const origin = window.location?.origin || "";
	const isFileProtocol = origin.startsWith("file:");
	const normalizedOrigin = origin.endsWith("/")
		? origin.slice(0, -1)
		: origin || "";

	if (!normalizedOrigin || isFileProtocol) {
		return "http://localhost:3000/api";
	}

	return `${normalizedOrigin}/api`;
};

const buildHeaders = (customHeaders = {}, hasBody = false) => {
	const headers = {
		Accept: "application/json",
		...customHeaders,
	};

	if (hasBody && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json;charset=utf-8";
	}

	return headers;
};

const buildQueryString = (params = {}) => {
	const entries = Object.entries(params).filter(
		([, value]) => value !== undefined && value !== null && value !== ""
	);
	if (!entries.length) {
		return "";
	}
	const query = new URLSearchParams();
	for (const [key, value] of entries) {
		query.append(key, value);
	}
	return `?${query.toString()}`;
};

class LibreriaProxy {
	constructor(baseUrl = resolveBaseUrl()) {
		this.baseUrl = baseUrl;
	}

	url(pathname = "") {
		const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
		return `${this.baseUrl}${path}`;
	}

	async request(path, options = {}) {
		const url = path.startsWith("http") ? path : this.url(path);
		const hasBody = Boolean(options.body);
		const response = await fetch(url, {
			credentials: "same-origin",
			...options,
			headers: buildHeaders(options.headers, hasBody),
		});

		const contentType = response.headers.get("content-type") || "";
		const isJson = contentType.includes("application/json");

		if (!response.ok) {
			let errorMessage = response.statusText || "Error en la peticion";
			if (isJson) {
				try {
					const body = await response.json();
					errorMessage = body?.error || errorMessage;
				} catch {
					// Ignorar errores de parseo
				}
			} else {
				const text = await response.text();
				errorMessage = text?.slice(0, 160) || errorMessage;
			}
			throw new Error(errorMessage);
		}

		if (response.status === 204) {
			return null;
		}

		if (!isJson) {
			const text = await response.text();
			throw new Error(
				"La respuesta del servidor no es JSON valido. Detalle: " +
					text.slice(0, 160)
			);
		}

		return response.json();
	}

	get(path, params) {
		const suffix = params ? `${path}${buildQueryString(params)}` : path;
		return this.request(suffix);
	}

	post(path, payload) {
		return this.request(path, {
			method: "POST",
			body: payload ? JSON.stringify(payload) : undefined,
		});
	}

	put(path, payload) {
		return this.request(path, {
			method: "PUT",
			body: payload ? JSON.stringify(payload) : undefined,
		});
	}

	delete(path) {
		return this.request(path, { method: "DELETE" });
	}

	// Libros
	getLibros(params) {
		return this.get("/libros", params);
	}

	getLibroPorId(id) {
		return this.get(`/libros/${id}`);
	}

	crearLibro(payload) {
		return this.post("/libros", payload);
	}

	actualizarLibro(id, payload) {
		return this.put(`/libros/${id}`, payload);
	}

	borrarLibro(id) {
		return this.delete(`/libros/${id}`);
	}

	// Clientes
	getClientes() {
		return this.get("/clientes");
	}

	getClientePorId(id) {
		return this.get(`/clientes/${id}`);
	}

	agregarCliente(payload) {
		return this.post("/clientes", payload);
	}

	actualizarCliente(id, payload) {
		return this.put(`/clientes/${id}`, payload);
	}

	borrarCliente(id) {
		return this.delete(`/clientes/${id}`);
	}

	autenticarCliente(payload) {
		return this.post("/clientes/autenticar", payload);
	}

	getCarroCliente(id) {
		return this.get(`/clientes/${id}/carro`);
	}

	agregarItemCarro(id, item) {
		return this.post(`/clientes/${id}/carro/items`, { item });
	}

	actualizarCantidadCarro(id, index, cantidad) {
		return this.put(`/clientes/${id}/carro/items/${index}`, { cant: cantidad });
	}

	eliminarItemCarro(id, index) {
		return this.delete(`/clientes/${id}/carro/items/${index}`);
	}

	vaciarCarro(id) {
		return this.delete(`/clientes/${id}/carro`);
	}

	// Admins
	getAdmins() {
		return this.get("/admins");
	}

	getAdminPorId(id) {
		return this.get(`/admins/${id}`);
	}

	agregarAdmin(payload) {
		return this.post("/admins", payload);
	}

	actualizarAdmin(id, payload) {
		return this.put(`/admins/${id}`, payload);
	}

	borrarAdmin(id) {
		return this.delete(`/admins/${id}`);
	}

	autenticarAdmin(payload) {
		return this.post("/admins/autenticar", payload);
	}

	// Facturas
	getFacturas(params) {
		return this.get("/facturas", params);
	}

	getFacturaPorId(id) {
		return this.get(`/facturas/${id}`);
	}

	facturar(payload) {
		return this.post("/facturas", payload);
	}

	// Alias compras (compatibilidad)
	getCompras() {
		return this.get("/compras");
	}

	getCompra(id) {
		return this.get(`/compras/${id}`);
	}

	agregarCompra(payload) {
		return this.post("/compras", payload);
	}
}

export const libreriaProxy = new LibreriaProxy();
