import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

const templateUrl = new URL("./login.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar invitado/login.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de inicio de sesión.</div>';
}

export class Login extends Presenter {
	constructor() {
		super(null, "login");
		this.isLoading = false;
		this.onSubmit = this.onSubmit.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.updateLoadingState();

		if (this.form) {
			this.form.addEventListener("submit", this.onSubmit);
		}
	}

	cacheDom() {
		this.form = this.container.querySelector("#form-login");
		if (!this.form) {
			return;
		}

		this.submitButton = this.form.querySelector('[data-element="submit-btn"]');
		this.usuarioInput = this.form.querySelector("#usuario");
		this.passwordInput = this.form.querySelector("#password");
		this.rolSelect = this.form.querySelector("#rol");
	}

	updateLoadingState() {
		if (!this.submitButton) {
			return;
		}

		if (this.isLoading) {
			this.submitButton.disabled = true;
			this.submitButton.textContent = "⏳ Iniciando sesión...";
			this.submitButton.classList.add("is-loading");
		} else {
			this.submitButton.disabled = false;
			this.submitButton.textContent = "🔐 Iniciar Sesión";
			this.submitButton.classList.remove("is-loading");
		}
	}

	async onSubmit(event) {
		event.preventDefault();

		if (!this.form) {
			return;
		}

		this.isLoading = true;
		this.updateLoadingState();
		authStore.setLoading(true);

		const formData = new FormData(this.form);
		const credentials = {
			usuario: (formData.get("usuario") ?? "").toString().trim(),
			password: (formData.get("password") ?? "").toString(),
			rol: (formData.get("rol") ?? "").toString(),
		};

		try {
			const result = await authService.login(
				credentials.usuario,
				credentials.password,
				credentials.rol
			);

			if (!result.success) {
				authStore.setError(result.error);
				session.pushError(result.error);
				this.isLoading = false;
				this.updateLoadingState();
				return;
			}

			authStore.setLogin(result.usuario, result.token);
			session.setUser(result.usuario);

			const nombreCompleto = [result.usuario.nombre, result.usuario.apellidos]
				.filter(Boolean)
				.join(" ");

			session.pushSuccess(
				result.message ||
					`¡Bienvenido, ${nombreCompleto || result.usuario.nombre}!`
			);

			const redirectUrl = credentials.rol === "ADMIN" ? "/a" : "/c";
			router.navigate(redirectUrl);

			setTimeout(() => {
				window.dispatchEvent(
					new CustomEvent("user-logged-in", { detail: result.usuario })
				);
			}, 100);
		} catch (error) {
			console.error(error);
			session.pushError("No se pudo iniciar sesión. Inténtalo de nuevo.");
		} finally {
			authStore.setLoading(false);
			this.isLoading = false;
			this.updateLoadingState();
		}
	}

	destroy() {
		if (this.form) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		if (typeof super.destroy === "function") {
			super.destroy();
		}
	}
}
