import { Presenter } from "../../commons/presenter.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";

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
		super(libreriaStore, "invitado-ver-libro");
		this.libro = null;
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		await this.loadLibro();

		if (!this.libro) {
			this.renderNotFound();
			return;
		}

		this.populateLibro(this.libro);
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.authorEl = this.container.querySelector('[data-element="author"]');
		this.isbnEl = this.container.querySelector('[data-element="isbn"]');
		this.priceEl = this.container.querySelector('[data-element="price"]');
		this.stockEl = this.container.querySelector('[data-element="stock"]');
	}

	async loadLibro() {
		const path = window.location.pathname;
		const match = path.match(/\/(?:c\/)?libros\/([a-fA-F0-9]{24})/);
		if (!match) {
			this.libro = null;
			return;
		}

		const id = match[1];

		try {
			this.libro = await this.model.getLibroById(id, { force: true });
		} catch (error) {
			console.error("Error cargando libro para invitado:", error);
			this.libro = null;
		}
	}

	populateLibro(libro) {
		if (!this.wrapper) {
			return;
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
	}

	renderNotFound() {
		if (this.container) {
			this.container.innerHTML = '<div class="error">Libro no encontrado</div>';
		}
	}
}
