const resolveBaseUrl = () => {
	if (typeof window === "undefined") {
		return "/api";
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

class LibreriaProxy {
	constructor() {
		this.baseApiUrl = resolveBaseUrl();
		this.comprasPath = `${this.baseApiUrl}/compras`;
	}

	async getCompras() {
		return this.request(this.comprasPath);
	}

	async getCompra(id) {
		const compraId =
			typeof id === "number" ? id : Number.parseInt(id ?? "", 10);
		if (!Number.isFinite(compraId)) {
			throw new Error("Id de compra no valido");
		}

		return this.request(`${this.comprasPath}/${compraId}`);
	}

	async addCompra(data) {
		const payload = data ?? {};
		return this.request(this.comprasPath, {
			method: "POST",
			body: JSON.stringify(payload),
		});
	}

	async request(url, options = {}) {
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
					const errorBody = await response.json();
					if (errorBody?.error) {
						errorMessage = errorBody.error;
					}
				} catch {
					// Ignorar errores de parseo
				}
			} else {
				const text = await response.text();
				errorMessage = text?.slice(0, 160) || errorMessage;
			}
			throw new Error(`Error ${response.status}: ${errorMessage}`);
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
}

export const libreriaProxy = new LibreriaProxy();
