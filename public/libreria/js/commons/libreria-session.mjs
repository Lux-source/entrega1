class LibreriaSession {
	constructor() {
		this.messages = [];
	}

	// Gestión de usuario
	setUser(usuario) {
		localStorage.setItem("usuario", JSON.stringify(usuario));
	}

	getUser() {
		const data = localStorage.getItem("usuario");
		return data ? JSON.parse(data) : null;
	}

	clearUser() {
		localStorage.removeItem("usuario");
	}

	getRole() {
		const user = this.getUser();
		if (!user || !user.rol) {
			return "invitado";
		}
		return user.rol.toLowerCase();
	}

	// Sistema de mensajes
	pushInfo(msg) {
		this.messages.push({ type: "info", text: msg, id: Date.now() });
		this.notifyMessages();
	}

	pushError(msg) {
		this.messages.push({ type: "error", text: msg, id: Date.now() });
		this.notifyMessages();
	}

	pushSuccess(msg) {
		this.messages.push({ type: "success", text: msg, id: Date.now() });
		this.notifyMessages();
	}

	consume() {
		const msgs = [...this.messages];
		this.messages = [];
		return msgs;
	}

	notifyMessages() {
		window.dispatchEvent(new CustomEvent("messages-updated"));
	}

	// Persistencia por usuario
	getKeySesionCliente(baseKey) {
		const sanitizedKey = (baseKey || "").trim();
		if (!sanitizedKey) {
			throw new Error("La clave base es obligatoria para la persistencia");
		}

		const user = this.getUser();
		if (user) {
			if (user.id !== undefined && user.id !== null) {
				return `${sanitizedKey}_${user.id}`;
			}
			if (user.email) {
				return `${sanitizedKey}_${user.email.toLowerCase()}`;
			}
		}

		return `${sanitizedKey}_invitado`;
	}

	leerArrayClienteSesion(baseKey) {
		const scopedKey = this.getKeySesionCliente(baseKey);
		const scopedResult = this.#readArrayFromStorage(scopedKey);
		if (scopedResult.exists) {
			return scopedResult.value;
		}

		const legacyResult = this.#readArrayFromStorage(baseKey);
		if (legacyResult.exists) {
			this.escribirArrayClienteSesion(baseKey, legacyResult.value);
			localStorage.removeItem(baseKey);
			return legacyResult.value;
		}

		return [];
	}

	escribirArrayClienteSesion(baseKey, data) {
		const scopedKey = this.getKeySesionCliente(baseKey);
		const safeData = Array.isArray(data) ? data : [];
		localStorage.setItem(scopedKey, JSON.stringify(safeData));
	}

	limpiarItemClienteSesion(baseKey) {
		const scopedKey = this.getKeySesionCliente(baseKey);
		localStorage.removeItem(scopedKey);
	}

	#readArrayFromStorage(key) {
		const raw = localStorage.getItem(key);
		if (raw === null) {
			return { exists: false, value: [] };
		}

		try {
			const parsed = JSON.parse(raw);
			return { exists: true, value: Array.isArray(parsed) ? parsed : [] };
		} catch (error) {
			console.warn(`No se pudo parsear los datos almacenados en ${key}`, error);
			localStorage.removeItem(key);
			return { exists: false, value: [] };
		}
	}
}

export const session = new LibreriaSession();
