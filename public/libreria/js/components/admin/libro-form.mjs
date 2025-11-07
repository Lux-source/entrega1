import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/seeder.mjs";
import { Libro } from "../../model/libro.mjs";

const templateUrl = new URL("./libro-form.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar admin/libro-form.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar el formulario del libro.</div>';
}

export class AdminLibroForm extends Presenter {
	constructor() {
		super(model, "admin-libro-form");
		this.isEdit = false;
		this.libro = null;
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.determineMode();
		this.cacheDom();

		if (this.isEdit && !this.libro) {
			session.pushError("Libro no encontrado");
			router.navigate("/a");
			return;
		}

		this.populateForm();
		this.attachEvents();
	}

	determineMode() {
		const match = window.location.pathname.match(/\/a\/libros\/editar\/(\d+)/);
		if (!match) {
			this.isEdit = false;
			this.libro = null;
			return;
		}

		this.isEdit = true;
		const id = Number.parseInt(match[1], 10);
		if (Number.isNaN(id)) {
			this.libro = null;
			return;
		}

		this.libro = this.model.libros.find((lib) => lib.id === id) ?? null;
	}

	cacheDom() {
		this.form = this.container.querySelector("#form-libro");
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.submitButton = this.container.querySelector(
			'[data-element="submit-button"]'
		);
		this.cancelLink = this.container.querySelector(
			'[data-element="cancel-link"]'
		);

		if (!this.form) {
			return;
		}

		this.inputs = {
			titulo: this.form.querySelector("#titulo"),
			autor: this.form.querySelector("#autor"),
			isbn: this.form.querySelector("#isbn"),
			precio: this.form.querySelector("#precio"),
			stock: this.form.querySelector("#stock"),
		};
	}

	populateForm() {
		if (!this.form) {
			return;
		}

		const libro = this.libro ?? {};
		if (this.titleEl) {
			this.titleEl.textContent = this.isEdit ? "Editar Libro" : "Nuevo Libro";
		}

		if (this.submitButton) {
			this.submitButton.textContent = this.isEdit
				? "Guardar Cambios"
				: "Crear Libro";
		}

		const cancelHref = this.isEdit && libro.id ? `/a/libros/${libro.id}` : "/a";
		if (this.cancelLink) {
			this.cancelLink.href = cancelHref;
		}

		if (!this.inputs) {
			return;
		}

		this.inputs.titulo.value = libro.titulo ?? "";
		this.inputs.autor.value = libro.autor ?? "";
		this.inputs.isbn.value = libro.isbn ?? "";
		this.inputs.precio.value = libro.precio ?? "";
		this.inputs.stock.value = libro.stock ?? 0;
	}

	attachEvents() {
		if (!this.form) {
			return;
		}

		this.onSubmit = (event) => {
			event.preventDefault();
			this.handleSubmit(new FormData(this.form));
		};

		this.form.addEventListener("submit", this.onSubmit);
	}

	handleSubmit(formData) {
		const rawPrecio = Number.parseFloat(formData.get("precio"));
		const rawStock = Number.parseInt(formData.get("stock"), 10);
		const data = {
			titulo: (formData.get("titulo") ?? "").toString().trim(),
			autor: (formData.get("autor") ?? "").toString().trim(),
			isbn: (formData.get("isbn") ?? "").toString().trim(),
			precio: Number.isFinite(rawPrecio) && rawPrecio > 0 ? rawPrecio : 0,
			stock: Number.isInteger(rawStock) && rawStock >= 0 ? rawStock : 0,
		};

		if (this.isEdit && this.libro) {
			Object.assign(this.libro, data);
			session.pushSuccess("Libro actualizado correctamente");
			router.navigate(`/a/libros/${this.libro.id}`);
			return;
		}

		const nuevoId = Math.max(0, ...this.model.libros.map((lib) => lib.id)) + 1;
		const nuevoLibro = new Libro(
			nuevoId,
			data.titulo,
			data.autor,
			data.isbn,
			Number.isFinite(data.precio) ? data.precio : 0,
			Number.isFinite(data.stock) ? data.stock : 0
		);

		this.model.libros.push(nuevoLibro);
		session.pushSuccess("Libro creado correctamente");
		router.navigate(`/a/libros/${nuevoLibro.id}`);
	}

	desmontar() {
		if (this.form && this.onSubmit) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		super.desmontar();
	}
}
