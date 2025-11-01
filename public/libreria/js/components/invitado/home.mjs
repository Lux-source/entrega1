import { Presenter } from "../../commons/presenter.mjs";
import { model } from "../../model/index.js";

const templateUrl = new URL("./home.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar invitado/home.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de inicio.</div>';
}

export class InvitadoHome extends Presenter {
	constructor() {
		super(model, "invitado-home");
		this.currentPage = 1;
		this.itemsPerPage = 12;
		this.totalPages = 1;
		this.onPaginationClick = this.onPaginationClick.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderHero();
		this.renderCatalog();

		if (this.paginationEl) {
			this.paginationEl.addEventListener("click", this.onPaginationClick);
		}
	}

	cacheDom() {
		this.heroContainer = this.container.querySelector('[data-element="hero"]');
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
		if (this.heroContainer) {
			this.heroContainer.innerHTML = this.heroContent();
		}
	}

	renderCatalog() {
		if (!this.catalogSummaryEl || !this.booksGridEl) {
			return;
		}

		const libros = Array.isArray(this.model.libros) ? this.model.libros : [];
		const totalLibros = libros.length;

		if (totalLibros === 0) {
			this.totalPages = 1;
			this.currentPage = 1;
			this.catalogSummaryEl.textContent =
				"No hay libros disponibles en este momento.";
			this.booksGridEl.innerHTML = `
				<p class="catalog-empty">
					Vuelve más tarde para descubrir nuevos títulos.
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
		const precio = Number.isFinite(libro?.precio) ? libro.precio : 0;
		const portada = libro?.portada ?? "";

		return `
			<article class="book-card">
				<img src="${portada}" alt="${titulo}" loading="lazy">
				<h3>${titulo}</h3>
				<p class="author">${autor}</p>
				<p class="price">${precio.toFixed(2)}€</p>
				<a href="${this.getLibroLink(
					libro
				)}" data-link class="btn btn-small">Ver detalles</a>
			</article>
		`;
	}

	heroContent() {
		return `
			<h1>Bienvenido a nuestra Librería Online</h1>
			<p>Descubre miles de libros al mejor precio</p>
			<div class="hero-actions">
				<a href="/login" data-link class="btn btn-primary">Iniciar Sesión</a>
				<a href="/registro" data-link class="btn btn-secondary">Registrarse</a>
			</div>
		`;
	}

	getLibroLink(libro) {
		return `/libros/${libro?.id ?? ""}`;
	}

	onPaginationClick(event) {
		const button = event.target.closest("button[data-action]");
		if (!button || button.disabled) {
			return;
		}

		const action = button.dataset.action;
		if (action === "prev" && this.currentPage > 1) {
			this.currentPage -= 1;
			this.renderCatalog();
		} else if (action === "next" && this.currentPage < this.totalPages) {
			this.currentPage += 1;
			this.renderCatalog();
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	destroy() {
		if (this.paginationEl) {
			this.paginationEl.removeEventListener("click", this.onPaginationClick);
		}

		if (typeof super.destroy === "function") {
			super.destroy();
		}
	}
}
