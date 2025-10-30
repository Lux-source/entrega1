/**
 * Auth Store - Maneja el estado de autenticación de manera reactiva
 */
class AuthStore {
	constructor() {
		this.user = null;
		this.token = null;
		this.isLoading = false;
		this.error = null;
		this.isAuthenticated = false;
		this.observers = [];
	}

	// Subscribe para cambios reactivos
	subscribe(callback) {
		this.observers.push(callback);
	}

	unsubscribe(callback) {
		this.observers = this.observers.filter((obs) => obs !== callback);
	}

	notifyObservers() {
		this.observers.forEach((callback) => callback(this.getState()));
	}

	getState() {
		return {
			user: this.user,
			token: this.token,
			isLoading: this.isLoading,
			error: this.error,
			isAuthenticated: this.isAuthenticated,
		};
	}

	setLogin(user, token) {
		this.user = user;
		this.token = token;
		this.isAuthenticated = true;
		this.error = null;
		this.isLoading = false;
		localStorage.setItem("auth_user", JSON.stringify(user));
		localStorage.setItem("auth_token", token);
		this.notifyObservers();
	}

	setLogout() {
		this.user = null;
		this.token = null;
		this.isAuthenticated = false;
		this.error = null;
		this.isLoading = false;
		localStorage.removeItem("auth_user");
		localStorage.removeItem("auth_token");
		this.notifyObservers();
	}

	setLoading(isLoading) {
		this.isLoading = isLoading;
		this.notifyObservers();
	}

	setError(error) {
		this.error = error;
		this.isLoading = false;
		this.notifyObservers();
	}

	clearError() {
		this.error = null;
		this.notifyObservers();
	}

	// Recuperar sesión del localStorage
	restoreSession() {
		const user = localStorage.getItem("auth_user");
		const token = localStorage.getItem("auth_token");

		if (user && token) {
			this.user = JSON.parse(user);
			this.token = token;
			this.isAuthenticated = true;
			this.notifyObservers();
			return true;
		}
		return false;
	}
}

export const authStore = new AuthStore();
