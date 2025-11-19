import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";

const templateUrl = new URL("./home.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar admin/home.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de inicio de administrador.</div>';
}

export class AdminHome extends Presenter {
	constructor() {
		super(libreriaStore, "admin-home");
		this.currentPage = 1;
		this.itemsPerPage = 12;
		this.totalPages = 1;
		this.onPaginationClick = this.onPaginationClick.bind(this);
		this.libros = [];
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		await this.loadLibros();
		this.renderHero();
		this.renderCatalog();

		if (this.paginationEl) {
			this.paginationEl.addEventListener("click", this.onPaginationClick);
		}
	}

	async loadLibros() {
		try {
			this.libros = await this.model.getLibros({ force: true });
		} catch (error) {
			console.error("Error cargando libros para AdminHome:", error);
			this.libros = [];
		}
	}
	cacheDom() {
		this.heroEl = this.container.querySelector('[data-element="hero"]');
		this.catalogSummaryEl = this.container.querySelector(
			'[data-element="catalog-summary"]'
		);
		this.booksGridEl = this.container.querySelector(
			'[data-element="books-grid"]'
		);
		this.paginationEl = this.container.querySelector(
			'[data-element="pagination"]'
		);
	}

	renderHero() {
		if (this.heroEl) {
			this.heroEl.innerHTML = this.heroContent();
		}
	}

	renderCatalog() {
		if (!this.catalogSummaryEl || !this.booksGridEl) {
			return;
		}

		const libros = Array.isArray(this.libros) ? this.libros : [];
		const totalLibros = libros.length;

		if (totalLibros === 0) {
			this.totalPages = 1;
			this.currentPage = 1;
			this.catalogSummaryEl.textContent = "No hay libros registrados todavía.";
			this.booksGridEl.innerHTML = `
                <p class="catalog-empty">
                    Usa el botón “Nuevo Libro” para añadir el primero.
                </p>
            `;
			this.renderPagination();
			return;
		}

		this.totalPages = Math.max(1, Math.ceil(totalLibros / this.itemsPerPage));
		if (this.currentPage > this.totalPages) {
			this.currentPage = this.totalPages;
		}

		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = Math.min(startIndex + this.itemsPerPage, totalLibros);
		const librosPaginados = libros.slice(startIndex, endIndex);

		this.catalogSummaryEl.textContent = `Mostrando ${
			startIndex + 1
		}-${endIndex} de ${totalLibros} libros`;
		this.booksGridEl.innerHTML = librosPaginados
			.map((libro) => this.createBookCard(libro))
			.join("");

		this.renderPagination();
	}

	renderPagination() {
		if (!this.paginationEl) {
			return;
		}

		if (this.totalPages <= 1) {
			this.paginationEl.innerHTML = "";
			return;
		}

		this.paginationEl.innerHTML = `
            <button type="button" class="btn btn-pagination" data-action="prev">
                ← Anterior
            </button>
            <span class="pagination-info">
                Página ${this.currentPage} de ${this.totalPages}
            </span>
            <button type="button" class="btn btn-pagination" data-action="next">
                Siguiente →
            </button>
        `;

		const prevButton = this.paginationEl.querySelector('[data-action="prev"]');
		const nextButton = this.paginationEl.querySelector('[data-action="next"]');

		if (prevButton) {
			prevButton.disabled = this.currentPage === 1;
		}

		if (nextButton) {
			nextButton.disabled = this.currentPage === this.totalPages;
		}
	}

	createBookCard(libro) {
		const titulo = libro?.titulo ?? "Título no disponible";
		const autor = libro?.autor ?? "Autor desconocido";
		const stock = Number.isFinite(libro?.stock) ? libro.stock : 0;
		const precio = Number.isFinite(libro?.precio) ? libro.precio : 0;

		return `
            <article class="book-card admin-card">
                <h3>${titulo}</h3>
                <p class="author">${autor}</p>
				<p class="price">Precio: ${precio.toFixed(2)}€</p>
                <p class="stock">Stock: ${stock}</p>
                <div class="card-actions">
                    <a href="${this.getLibroLink(
											libro
										)}" data-link class="btn btn-small">Editar</a>
                </div>
            </article>
        `;
	}

	getLibroLink(libro) {
		const id = libro?.id ?? "";
		return `/a/libros/${id}`;
	}

	heroContent() {
		const user = session.getUser();
		const nombre = user?.nombre ?? "Administrador";
		return `
            <h1>Bienvenido, ${nombre}</h1>
            <p>Gestiona el catálogo</p>
            <div class="hero-actions">
                <a href="/a/libros/nuevo" data-link class="btn btn-primary">Nuevo Libro</a>
            </div>
        `;
	}

	onPaginationClick(event) {
		const button = event.target.closest("button[data-action]");
		if (!button || button.disabled) {
			return;
		}

		if (button.dataset.action === "prev" && this.currentPage > 1) {
			this.currentPage -= 1;
			this.renderCatalog();
		} else if (
			button.dataset.action === "next" &&
			this.currentPage < this.totalPages
		) {
			this.currentPage += 1;
			this.renderCatalog();
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	desmontar() {
		if (this.paginationEl) {
			this.paginationEl.removeEventListener("click", this.onPaginationClick);
		}

		super.desmontar();
	}
}
