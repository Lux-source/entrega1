import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { api } from "../../model/api-proxy.mjs";

const templateUrl = new URL("./ver-libro.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar admin/ver-libro.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de detalles del libro.</div>';
}

export class AdminVerLibro extends Presenter {
	constructor() {
		super(null, "admin-ver-libro");
		this.libro = null;
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		const id = this.getLibroIdFromRoute();

		if (!id) {
			session.pushError("Libro no encontrado");
			router.navigate("/a");
			return;
		}

		try {
			this.libro = await api.getLibroById(id);
			if (!this.libro) {
				session.pushError("Libro no encontrado");
				router.navigate("/a");
				return;
			}
			this.renderLibro();
			this.attachEvents();
		} catch (error) {
			console.error("Error al cargar el libro:", error);
			session.pushError("Error al cargar el libro");
			router.navigate("/a");
		}
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.editLink = this.container.querySelector('[data-element="edit-link"]');
		this.deleteButton = this.container.querySelector(
			'[data-element="delete-button"]'
		);
		this.stockValueEl = this.container.querySelector(
			'[data-element="stock-value"]'
		);
		this.priceValueEl = this.container.querySelector(
			'[data-element="price-value"]'
		);
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.authorEl = this.container.querySelector('[data-element="author"]');
		this.isbnEl = this.container.querySelector('[data-element="isbn"]');
		this.idBadgeEl = this.container.querySelector('[data-element="id-badge"]');
		this.sections = {
			lowStock: this.container.querySelector('[data-section="low-stock"]'),
		};
	}

	getLibroIdFromRoute() {
		const match = window.location.pathname.match(/\/a\/libros\/(\d+)/);
		if (!match) {
			return null;
		}

		const id = Number.parseInt(match[1], 10);
		return Number.isNaN(id) ? null : id;
	}

	renderLibro() {
		if (!this.libro || !this.wrapper) {
			return;
		}

		if (this.editLink) {
			this.editLink.href = `/a/libros/editar/${this.libro.id}`;
		}

		if (this.stockValueEl) {
			this.stockValueEl.textContent = `${this.libro.stock ?? 0}`;
			this.stockValueEl.classList.toggle(
				"low-stock",
				(this.libro.stock ?? 0) < 5
			);
		}

		if (this.priceValueEl) {
			const precio = Number.isFinite(this.libro.precio) ? this.libro.precio : 0;
			this.priceValueEl.textContent = `${precio.toFixed(2)}€`;
		}

		if (this.titleEl) {
			this.titleEl.textContent = this.libro.titulo ?? "Título no disponible";
		}

		if (this.authorEl) {
			this.authorEl.textContent = `Por ${
				this.libro.autor ?? "Autor desconocido"
			}`;
		}

		if (this.isbnEl) {
			this.isbnEl.textContent = this.libro.isbn ?? "N/A";
		}

		if (this.idBadgeEl) {
			this.idBadgeEl.textContent = `ID: ${this.libro.id}`;
		}

		const isLowStock = (this.libro.stock ?? 0) < 5;
		this.toggleSection("lowStock", isLowStock);
	}

	attachEvents() {
		if (this.deleteButton) {
			this.deleteHandler = () => {
				if (
					confirm(
						"¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer."
					)
				) {
					this.eliminarLibro();
				}
			};
			this.deleteButton.addEventListener("click", this.deleteHandler);
		}
	}

	toggleSection(sectionKey, visible) {
		const section = this.sections?.[sectionKey];
		if (!section) {
			return;
		}
		section.style.display = visible ? "" : "none";
	}

	eliminarLibro() {
		if (!this.libro) {
			return;
		}

		const index = this.model.libros.findIndex(
			(libro) => libro.id === this.libro.id
		);
		if (index === -1) {
			session.pushError("Error al eliminar el libro");
			return;
		}

		this.model.libros.splice(index, 1);
		session.pushSuccess("Libro eliminado correctamente");
		router.navigate("/a");
	}

	desmontar() {
		if (this.deleteButton && this.deleteHandler) {
			this.deleteButton.removeEventListener("click", this.deleteHandler);
		}

		super.desmontar();
	}
}
