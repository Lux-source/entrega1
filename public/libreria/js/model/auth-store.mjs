class AlmacenAutenticacion {
	constructor() {
		this.usuario = null;
		this.token = null;
		this.estaCargando = false;
		this.error = null;
		this.estaAutenticado = false;
		this.observadores = [];
	}
	suscribir(callback) {
		this.observadores.push(callback);
	}

	desuscribir(callback) {
		this.observadores = this.observadores.filter((obs) => obs !== callback);
	}

	notificarObservadores() {
		this.observadores.forEach((callback) => callback(this.obtenerEstado()));
	}

	obtenerEstado() {
		return {
			usuario: this.usuario,
			token: this.token,
			estaCargando: this.estaCargando,
			error: this.error,
			estaAutenticado: this.estaAutenticado,
			user: this.usuario,
			isLoading: this.estaCargando,
			isAuthenticated: this.estaAutenticado,
		};
	}

	establecerInicioSesion(user, token) {
		this.usuario = user;
		this.token = token;
		this.estaAutenticado = true;
		this.error = null;
		this.estaCargando = false;
		localStorage.setItem("auth_user", JSON.stringify(user));
		localStorage.setItem("auth_token", token);
		this.notificarObservadores();
	}

	establecerCierreSesion() {
		this.usuario = null;
		this.token = null;
		this.estaAutenticado = false;
		this.error = null;
		this.estaCargando = false;
		localStorage.removeItem("auth_user");
		localStorage.removeItem("auth_token");
		this.notificarObservadores();
	}

	establecerCargando(isLoading) {
		this.estaCargando = isLoading;
		this.notificarObservadores();
	}

	establecerError(error) {
		this.error = error;
		this.estaCargando = false;
		this.notificarObservadores();
	}

	actualizarUsuario(user) {
		this.usuario = user;
		localStorage.setItem("auth_user", JSON.stringify(user));
		if (this.token) {
			localStorage.setItem("auth_token", this.token);
		}
		this.notificarObservadores();
	}

	limpiarError() {
		this.error = null;
		this.notificarObservadores();
	}
	restaurarSesion() {
		const user = localStorage.getItem("auth_user");
		const token = localStorage.getItem("auth_token");

		if (user && token) {
			this.usuario = JSON.parse(user);
			this.token = token;
			this.estaAutenticado = true;
			this.notificarObservadores();
			return true;
		}
		return false;
	}
}

export const almacenAutenticacion = new AlmacenAutenticacion();
