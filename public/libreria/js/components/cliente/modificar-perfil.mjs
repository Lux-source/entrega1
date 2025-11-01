import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/index.js";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

const templateUrl = new URL("./modificar-perfil.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(
			`Error ${response.status} al cargar cliente/modificar-perfil.html`
		);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar el formulario de perfil.</div>';
}

export class ClienteModificarPerfil extends Presenter {
	constructor() {
		super(model, "cliente-modificar-perfil");
		this.onSubmit = this.onSubmit.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		const user = session.getUser();

		if (!user) {
			session.pushError("Sesión no encontrada. Inicia sesión nuevamente.");
			router.navigate("/login");
			return;
		}

		this.populateForm(user);

		if (this.form) {
			this.form.addEventListener("submit", this.onSubmit);
		}
	}

	cacheDom() {
		this.form = this.container.querySelector("#form-modificar-perfil");
		if (!this.form) {
			return;
		}

		this.fields = {
			id: this.form.querySelector('[data-element="input-id"]'),
			rol: this.form.querySelector('[data-element="input-rol"]'),
			nombre: this.form.querySelector('[data-element="input-nombre"]'),
			apellidos: this.form.querySelector('[data-element="input-apellidos"]'),
			dni: this.form.querySelector('[data-element="input-dni"]'),
			email: this.form.querySelector('[data-element="input-email"]'),
			telefono: this.form.querySelector('[data-element="input-telefono"]'),
			direccion: this.form.querySelector('[data-element="input-direccion"]'),
			password: this.form.querySelector('[data-element="input-password"]'),
			submit: this.form.querySelector('[data-element="submit-button"]'),
		};
	}

	populateForm(user) {
		if (!this.fields) {
			return;
		}

		if (this.fields.id) {
			this.fields.id.value = user.id ?? "";
		}

		if (this.fields.rol) {
			this.fields.rol.value = user.rol ?? "CLIENTE";
		}

		if (this.fields.nombre) {
			this.fields.nombre.value = user.nombre ?? "";
		}

		if (this.fields.apellidos) {
			this.fields.apellidos.value = user.apellidos ?? "";
		}

		if (this.fields.dni) {
			this.fields.dni.value = user.dni ?? "";
		}

		if (this.fields.email) {
			this.fields.email.value = user.email ?? "";
		}

		if (this.fields.telefono) {
			this.fields.telefono.value = (user.telefono ?? "").replace(/\s+/g, "");
		}

		if (this.fields.direccion) {
			this.fields.direccion.value = user.direccion ?? "";
		}

		if (this.fields.password) {
			this.fields.password.value = user.password ?? "";
		}
	}

	onSubmit(event) {
		event.preventDefault();

		if (!this.form) {
			return;
		}

		const user = session.getUser();
		if (!user) {
			session.pushError(
				"No se pudo actualizar el perfil. Intenta iniciar sesión nuevamente."
			);
			router.navigate("/login");
			return;
		}

		const formData = new FormData(this.form);
		const nombre = (formData.get("nombre") ?? "").toString().trim();
		const apellidos = (formData.get("apellidos") ?? "").toString().trim();
		const dni = (formData.get("dni") ?? "").toString().trim().toUpperCase();
		const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
		const telefono = (formData.get("telefono") ?? "")
			.toString()
			.replace(/\s+/g, "")
			.trim();
		const direccion = (formData.get("direccion") ?? "").toString().trim();
		const password = (formData.get("password") ?? "").toString();

		if (
			!nombre ||
			!apellidos ||
			!dni ||
			!email ||
			!telefono ||
			!direccion ||
			!password
		) {
			session.pushError("Todos los campos marcados con * son obligatorios.");
			return;
		}

		if (!authService.isValidDni(dni)) {
			session.pushError(
				"DNI inválido. Usa 7-8 dígitos y una letra (ej: 12345678A)"
			);
			return;
		}

		if (!authService.isValidEmail(email)) {
			session.pushError("Email inválido");
			return;
		}

		if (!authService.isValidTelefono(telefono)) {
			session.pushError(
				"Teléfono inválido. Usa solo dígitos (7-15 caracteres)"
			);
			return;
		}

		if (password.length < 6) {
			session.pushError("La contraseña debe tener al menos 6 caracteres");
			return;
		}

		const emailExiste = this.model.usuarios.some(
			(u) => u.id !== user.id && u.email?.toLowerCase() === email
		);
		if (emailExiste) {
			session.pushError("Este email ya está registrado por otro usuario");
			return;
		}

		const dniExiste = this.model.usuarios.some(
			(u) => u.id !== user.id && u.dni?.toUpperCase() === dni
		);
		if (dniExiste) {
			session.pushError("Este DNI ya está registrado por otro usuario");
			return;
		}

		const usuarioModel = this.model.usuarios.find((u) => u.id === user.id);
		if (!usuarioModel) {
			session.pushError("No se encontró el usuario en el sistema");
			return;
		}

		usuarioModel.nombre = nombre;
		usuarioModel.apellidos = apellidos;
		usuarioModel.dni = dni;
		usuarioModel.email = email;
		usuarioModel.telefono = telefono;
		usuarioModel.direccion = direccion;
		usuarioModel.password = password;

		const updatedUser = {
			id: usuarioModel.id,
			dni: usuarioModel.dni,
			nombre: usuarioModel.nombre,
			apellidos: usuarioModel.apellidos,
			direccion: usuarioModel.direccion,
			telefono: usuarioModel.telefono,
			email: usuarioModel.email,
			password: usuarioModel.password,
			rol: usuarioModel.rol,
		};

		session.setUser(updatedUser);
		authStore.updateUser(updatedUser);
		session.pushSuccess("Perfil actualizado correctamente");

		router.navigate("/c/perfil");

		setTimeout(() => {
			window.dispatchEvent(
				new CustomEvent("user-logged-in", { detail: updatedUser })
			);
		}, 100);
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
