import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";

const templateUrl = new URL("./perfil.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar cliente/perfil.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de perfil.</div>';
}

export class ClientePerfil extends Presenter {
	constructor() {
		super(null, "cliente-perfil");
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

		const compras = JSON.parse(localStorage.getItem("compras") || "[]");

		this.renderUser(user);
		this.renderStats(compras);
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
			compras: this.container.querySelector('[data-element="compras-count"]'),
			totalGastado: this.container.querySelector(
				'[data-element="total-gastado"]'
			),
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
			this.fields.name.textContent = nombreCompleto || user.nombre || "Cliente";
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
			this.fields.direccion.textContent = user.direccion ?? "No especificada";
		}

		if (this.fields.id) {
			this.fields.id.textContent = `#${user.id ?? ""}`;
		}
	}

	renderStats(compras) {
		const totalCompras = compras.length;
		const totalGastado = compras.reduce(
			(sum, compra) => sum + (compra.total || 0),
			0
		);

		if (this.fields?.compras) {
			this.fields.compras.textContent = String(totalCompras);
		}

		if (this.fields?.totalGastado) {
			this.fields.totalGastado.textContent = `${totalGastado.toFixed(2)}€`;
		}
	}
}
