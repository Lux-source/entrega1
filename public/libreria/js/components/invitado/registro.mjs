import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

const templateUrl = new URL("./registro.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(
			`Error ${response.status} al cargar invitado/registro.html`
		);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de registro.</div>';
}

export class Registro extends Presenter {
	constructor() {
		super(null, "registro");
		this.isLoading = false;

		this.onSubmit = this.onSubmit.bind(this);
		this.handleDniInput = this.handleDniInput.bind(this);
		this.handleTelefonoInput = this.handleTelefonoInput.bind(this);
		this.handlePasswordConfirmInput =
			this.handlePasswordConfirmInput.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.attachEvents();
		this.updateLoadingState();
	}

	cacheDom() {
		this.form = this.container.querySelector("#form-registro");
		if (!this.form) {
			return;
		}

		this.submitButton = this.form.querySelector('[data-element="submit-btn"]');
		this.dniInput = this.form.querySelector("#dni");
		this.telefonoInput = this.form.querySelector("#telefono");
		this.passwordInput = this.form.querySelector("#password");
		this.passwordConfirmInput = this.form.querySelector("#passwordConfirm");
	}

	attachEvents() {
		if (!this.form) {
			return;
		}

		this.form.addEventListener("submit", this.onSubmit);

		if (this.dniInput) {
			this.dniInput.addEventListener("input", this.handleDniInput);
		}

		if (this.telefonoInput) {
			this.telefonoInput.addEventListener("input", this.handleTelefonoInput);
		}

		if (this.passwordConfirmInput) {
			this.passwordConfirmInput.addEventListener(
				"input",
				this.handlePasswordConfirmInput
			);
		}
	}

	updateLoadingState() {
		if (!this.submitButton) {
			return;
		}

		if (this.isLoading) {
			this.submitButton.disabled = true;
			this.submitButton.textContent = "⏳ Registrando...";
			this.submitButton.classList.add("is-loading");
		} else {
			this.submitButton.disabled = false;
			this.submitButton.textContent = "✓ Crear Cuenta";
			this.submitButton.classList.remove("is-loading");
		}
	}

	handleDniInput(event) {
		const target = event.currentTarget;
		target.value = target.value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
	}

	handleTelefonoInput(event) {
		const target = event.currentTarget;
		target.value = target.value.replace(/[^0-9]/g, "");
	}

	handlePasswordConfirmInput() {
		if (!this.passwordInput || !this.passwordConfirmInput) {
			return;
		}

		if (
			this.passwordInput.value !== this.passwordConfirmInput.value &&
			this.passwordConfirmInput.value
		) {
			this.passwordConfirmInput.style.borderColor = "#e74c3c";
		} else {
			this.passwordConfirmInput.style.borderColor = "";
		}
	}

	async onSubmit(event) {
		event.preventDefault();

		if (!this.form) {
			return;
		}

		this.isLoading = true;
		this.updateLoadingState();

		const formData = new FormData(this.form);
		const datos = {
			dni: (formData.get("dni") ?? "").toString().trim(),
			nombre: (formData.get("nombre") ?? "").toString().trim(),
			apellidos: (formData.get("apellidos") ?? "").toString().trim(),
			direccion: (formData.get("direccion") ?? "").toString().trim(),
			telefono: (formData.get("telefono") ?? "").toString().replace(/\s+/g, ""),
			email: (formData.get("email") ?? "").toString().trim(),
			password: (formData.get("password") ?? "").toString(),
			passwordConfirm: (formData.get("passwordConfirm") ?? "").toString(),
			rol: (formData.get("rol") ?? "CLIENTE").toString(),
		};

		authStore.setLoading(true);

		try {
			const result = await authService.register(
				datos.dni,
				datos.nombre,
				datos.apellidos,
				datos.direccion,
				datos.telefono,
				datos.email,
				datos.password,
				datos.passwordConfirm,
				datos.rol
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

			setTimeout(() => {
				router.navigate("/c");
				window.dispatchEvent(
					new CustomEvent("user-logged-in", { detail: result.usuario })
				);
			}, 500);
		} catch (error) {
			console.error(error);
			session.pushError(
				"No se pudo completar el registro. Inténtalo nuevamente."
			);
			this.isLoading = false;
			this.updateLoadingState();
		} finally {
			authStore.setLoading(false);
		}
	}

	destroy() {
		if (this.form) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		if (this.dniInput) {
			this.dniInput.removeEventListener("input", this.handleDniInput);
		}

		if (this.telefonoInput) {
			this.telefonoInput.removeEventListener("input", this.handleTelefonoInput);
		}

		if (this.passwordConfirmInput) {
			this.passwordConfirmInput.removeEventListener(
				"input",
				this.handlePasswordConfirmInput
			);
		}

		if (typeof super.destroy === "function") {
			super.destroy();
		}
	}
}
