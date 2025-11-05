import { Presenter } from "../../commons/presenter.mjs";
import { model } from "../../model/seeder.mjs";

const templateUrl = new URL("./ver-libro.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(
			`Error ${response.status} al cargar invitado/ver-libro.html`
		);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista del libro.</div>';
}

export class InvitadoVerLibro extends Presenter {
	constructor() {
		super(model, "invitado-ver-libro");
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();

		const libro = this.getLibroFromPath();
		if (!libro) {
			this.renderNotFound();
			return;
		}

		this.populateLibro(libro);
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.coverEl = this.container.querySelector('[data-element="cover"]');
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.authorEl = this.container.querySelector('[data-element="author"]');
		this.isbnEl = this.container.querySelector('[data-element="isbn"]');
		this.priceEl = this.container.querySelector('[data-element="price"]');
		this.stockEl = this.container.querySelector('[data-element="stock"]');
		this.descriptionEl = this.container.querySelector(
			'[data-element="description"]'
		);
		this.editorialEl = this.container.querySelector(
			'[data-element="editorial"]'
		);
		this.anioEl = this.container.querySelector('[data-element="anio"]');
		this.paginasEl = this.container.querySelector('[data-element="paginas"]');
		this.idiomaEl = this.container.querySelector('[data-element="idioma"]');
	}

	getLibroFromPath() {
		const path = window.location.pathname;
		const match = path.match(/\/(?:c\/)?libros\/(\d+)/);
		if (!match) {
			return null;
		}

		const id = Number.parseInt(match[1], 10);
		if (Number.isNaN(id)) {
			return null;
		}

		return this.model.libros.find((libro) => libro.id === id) ?? null;
	}

	populateLibro(libro) {
		if (!this.wrapper) {
			return;
		}

		if (this.coverEl) {
			this.coverEl.src = libro.portada ?? "";
			this.coverEl.alt = libro.titulo ?? "Portada";
		}

		if (this.titleEl) {
			this.titleEl.textContent = libro.titulo ?? "Título no disponible";
		}

		if (this.authorEl) {
			this.authorEl.textContent = `Por ${libro.autor ?? "Autor desconocido"}`;
		}

		if (this.isbnEl) {
			this.isbnEl.textContent = `ISBN: ${libro.isbn ?? "N/A"}`;
		}

		if (this.priceEl) {
			const precio = Number.isFinite(libro.precio) ? libro.precio : 0;
			this.priceEl.textContent = `${precio.toFixed(2)}€`;
		}

		if (this.stockEl) {
			this.stockEl.textContent =
				libro.stock > 0
					? `✓ En stock (${libro.stock} disponibles)`
					: "✗ Agotado";
		}

		if (this.descriptionEl) {
			this.descriptionEl.textContent =
				libro.descripcion || "Sin descripción disponible.";
		}

		if (this.editorialEl) {
			this.editorialEl.textContent = libro.editorial || "N/A";
		}

		if (this.anioEl) {
			this.anioEl.textContent = libro.anio || "N/A";
		}

		if (this.paginasEl) {
			this.paginasEl.textContent = libro.paginas || "N/A";
		}

		if (this.idiomaEl) {
			this.idiomaEl.textContent = libro.idioma || "Español";
		}
	}

	renderNotFound() {
		if (this.container) {
			this.container.innerHTML = '<div class="error">Libro no encontrado</div>';
		}
	}
}
