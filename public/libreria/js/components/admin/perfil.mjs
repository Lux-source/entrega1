import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";

const templateUrl = new URL("./perfil.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar admin/perfil.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de perfil.</div>';
}

export class AdminPerfil extends Presenter {
	constructor() {
		super(libreriaStore, "admin-perfil");
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

		this.renderUser(user);
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.fields = {
			name: this.container.querySelector('[data-element="name"]'),
			email: this.container.querySelector('[data-element="email"]'),
			dni: this.container.querySelector('[data-element="dni"]'),
			telefono: this.container.querySelector('[data-element="telefono"]'),
			direccion: this.container.querySelector('[data-element="direccion"]'),
			id: this.container.querySelector('[data-element="id"]'),
			rol: this.container.querySelector('[data-element="rol"]'),
		};
	}

	renderUser(user) {
		if (!this.fields) {
			return;
		}

		const nombreCompleto = [user.nombre, user.apellidos]
			.filter(Boolean)
			.join(" ");
		if (this.fields.name) {
			this.fields.name.textContent =
				nombreCompleto || user.nombre || "Administrador";
		}

		if (this.fields.email) {
			this.fields.email.textContent = user.email ?? "";
		}

		if (this.fields.dni) {
			this.fields.dni.textContent = user.dni ?? "";
		}

		if (this.fields.telefono) {
			this.fields.telefono.textContent = user.telefono ?? "";
		}

		if (this.fields.direccion) {
			this.fields.direccion.textContent = user.direccion ?? "";
		}

		if (this.fields.id) {
			this.fields.id.textContent = `#${user.id ?? ""}`;
		}

		if (this.fields.rol) {
			this.fields.rol.textContent = user.rol ?? "ADMIN";
		}
	}
}
