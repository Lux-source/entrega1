import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/index.js";
import { Libro } from "../../model/libro.js";

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
			editorial: this.form.querySelector("#editorial"),
			precio: this.form.querySelector("#precio"),
			stock: this.form.querySelector("#stock"),
			anio: this.form.querySelector("#anio"),
			paginas: this.form.querySelector("#paginas"),
			idioma: this.form.querySelector("#idioma"),
			portada: this.form.querySelector("#portada"),
			descripcion: this.form.querySelector("#descripcion"),
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
		this.inputs.editorial.value = libro.editorial ?? "";
		this.inputs.precio.value = libro.precio ?? "";
		this.inputs.stock.value = libro.stock ?? 0;
		this.inputs.anio.value = libro.anio ?? "";
		this.inputs.paginas.value = libro.paginas ?? "";
		this.inputs.idioma.value = libro.idioma ?? "Español";
		this.inputs.portada.value = libro.portada ?? "";
		this.inputs.descripcion.value = libro.descripcion ?? "";
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
		const data = {
			titulo: (formData.get("titulo") ?? "").toString().trim(),
			autor: (formData.get("autor") ?? "").toString().trim(),
			isbn: (formData.get("isbn") ?? "").toString().trim(),
			precio: Number.parseFloat(formData.get("precio")),
			stock: Number.parseInt(formData.get("stock"), 10),
			portada: (formData.get("portada") ?? "").toString().trim(),
			descripcion: (formData.get("descripcion") ?? "").toString().trim(),
			editorial: (formData.get("editorial") ?? "").toString().trim(),
			anio: formData.get("anio")
				? Number.parseInt(formData.get("anio"), 10)
				: null,
			paginas: formData.get("paginas")
				? Number.parseInt(formData.get("paginas"), 10)
				: null,
			idioma: (formData.get("idioma") ?? "Español").toString(),
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
			Number.isFinite(data.stock) ? data.stock : 0,
			data.portada,
			data.descripcion,
			data.editorial,
			Number.isFinite(data.anio) ? data.anio : null,
			Number.isFinite(data.paginas) ? data.paginas : null,
			data.idioma
		);

		this.model.libros.push(nuevoLibro);
		session.pushSuccess("Libro creado correctamente");
		router.navigate(`/a/libros/${nuevoLibro.id}`);
	}

	destroy() {
		if (this.form && this.onSubmit) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		if (typeof super.destroy === "function") {
			super.destroy();
		}
	}
}
