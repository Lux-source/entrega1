import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";

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
		super(libreriaStore, "admin-libro-form");
		this.isEdit = false;
		this.libro = null;
	}

	template() {
		return templateHtml;
	}

	async bind() {
		await this.determineMode();
		this.cacheDom();

		if (this.isEdit && !this.libro) {
			session.pushError("Libro no encontrado");
			router.navigate("/a");
			return;
		}

		this.populateForm();
		this.attachEvents();
	}

	async determineMode() {
		const match = window.location.pathname.match(
			/\/a\/libros\/editar\/([a-fA-F0-9]{24})/
		);
		if (!match) {
			this.isEdit = false;
			this.libro = null;
			return;
		}

		this.isEdit = true;
		const id = match[1];

		try {
			this.libro = await this.model.getLibroById(id, { force: true });
		} catch (error) {
			console.error("Error cargando libro en AdminLibroForm:", error);
			this.libro = null;
		}
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

		this.onSubmit = async (event) => {
			event.preventDefault();
			await this.handleSubmit(new FormData(this.form));
		};

		this.form.addEventListener("submit", this.onSubmit);
	}

	async handleSubmit(formData) {
		const rawPrecio = Number.parseFloat(formData.get("precio"));
		const rawStock = Number.parseInt(formData.get("stock"), 10);
		const data = {
			titulo: (formData.get("titulo") ?? "").toString().trim(),
			autor: (formData.get("autor") ?? "").toString().trim(),
			isbn: (formData.get("isbn") ?? "").toString().trim(),
			precio: Number.isFinite(rawPrecio) && rawPrecio > 0 ? rawPrecio : 0,
			stock: Number.isInteger(rawStock) && rawStock >= 0 ? rawStock : 0,
		};

		try {
			if (this.isEdit && this.libro) {
				const actualizado = await this.model.actualizarLibro(
					this.libro.id,
					data
				);
				session.pushSuccess("Libro actualizado correctamente");
				router.navigate(`/a/libros/${actualizado.id}`);
				return;
			}

			const nuevoLibro = await this.model.crearLibro(data);
			session.pushSuccess("Libro creado correctamente");
			router.navigate(`/a/libros/${nuevoLibro.id}`);
		} catch (error) {
			console.error("Error guardando libro:", error);
			session.pushError(
				error?.message || "No se pudo guardar el libro. Intenta nuevamente"
			);
		}
	}

	desmontar() {
		if (this.form && this.onSubmit) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		super.desmontar();
	}
}
