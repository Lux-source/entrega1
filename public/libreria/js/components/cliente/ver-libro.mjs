import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/index.js";

const templateUrl = new URL("./ver-libro.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(
			`Error ${response.status} al cargar cliente/ver-libro.html`
		);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de detalles del libro.</div>';
}

export class ClienteVerLibro extends Presenter {
	constructor() {
		super(model, "cliente-ver-libro");
		this.libro = null;
		this.onAddToCart = this.onAddToCart.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.libro = this.getLibroFromRoute();

		if (!this.libro) {
			session.pushError("Libro no encontrado");
			router.navigate("/c");
			return;
		}

		this.renderLibro();
		this.attachEvents();
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.coverEl = this.container.querySelector('[data-element="cover"]');
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.authorEl = this.container.querySelector('[data-element="author"]');
		this.editorialEl = this.container.querySelector(
			'[data-element="editorial"]'
		);
		this.anioEl = this.container.querySelector('[data-element="anio"]');
		this.paginasEl = this.container.querySelector('[data-element="paginas"]');
		this.idiomaEl = this.container.querySelector('[data-element="idioma"]');
		this.isbnEl = this.container.querySelector('[data-element="isbn"]');
		this.descriptionEl = this.container.querySelector(
			'[data-element="description"]'
		);
		this.priceEl = this.container.querySelector('[data-element="price"]');
		this.stockEl = this.container.querySelector('[data-element="stock"]');
		this.quantityWrapper = this.container.querySelector(
			'[data-section="quantity"]'
		);
		this.quantityInput = this.container.querySelector(
			'[data-element="quantity-input"]'
		);
		this.addCartButton = this.container.querySelector(
			'[data-element="add-cart"]'
		);
		this.sections = {
			editorial: this.container.querySelector('[data-section="editorial"]'),
			anio: this.container.querySelector('[data-section="anio"]'),
			paginas: this.container.querySelector('[data-section="paginas"]'),
			descripcion: this.container.querySelector('[data-section="descripcion"]'),
		};
	}

	getLibroFromRoute() {
		const match = window.location.pathname.match(/\/c\/libros\/(\d+)/);
		if (!match) {
			return null;
		}

		const id = Number.parseInt(match[1], 10);
		if (Number.isNaN(id)) {
			return null;
		}

		return this.model.libros.find((libro) => libro.id === id) ?? null;
	}

	renderLibro() {
		if (!this.libro || !this.wrapper) {
			return;
		}

		if (this.coverEl) {
			this.coverEl.src = this.libro.portada ?? "";
			this.coverEl.alt = this.libro.titulo ?? "Portada";
		}

		if (this.titleEl) {
			this.titleEl.textContent = this.libro.titulo ?? "Título no disponible";
		}

		if (this.authorEl) {
			this.authorEl.textContent = `por ${
				this.libro.autor ?? "Autor desconocido"
			}`;
		}

		this.toggleSection("editorial", Boolean(this.libro.editorial));
		if (this.editorialEl) {
			this.editorialEl.textContent = this.libro.editorial ?? "";
		}

		this.toggleSection("anio", Boolean(this.libro.anio));
		if (this.anioEl) {
			this.anioEl.textContent = this.libro.anio ?? "";
		}

		this.toggleSection("paginas", Boolean(this.libro.paginas));
		if (this.paginasEl) {
			this.paginasEl.textContent = this.libro.paginas ?? "";
		}

		if (this.idiomaEl) {
			this.idiomaEl.textContent = this.libro.idioma ?? "Español";
		}

		if (this.isbnEl) {
			this.isbnEl.textContent = this.libro.isbn ?? "N/A";
		}

		const descripcion = this.libro.descripcion?.trim();
		this.toggleSection("descripcion", Boolean(descripcion));
		if (this.descriptionEl) {
			this.descriptionEl.textContent = descripcion ?? "";
		}

		if (this.priceEl) {
			const precio = Number.isFinite(this.libro.precio) ? this.libro.precio : 0;
			this.priceEl.textContent = `${precio.toFixed(2)}€`;
		}

		const stockDisponible = this.libro.stock ?? 0;
		if (this.stockEl) {
			this.stockEl.textContent =
				stockDisponible > 0 ? `${stockDisponible} disponibles` : "Agotado";
			this.stockEl.classList.toggle("out-of-stock", stockDisponible <= 0);
		}

		if (this.quantityWrapper) {
			this.quantityWrapper.style.display = stockDisponible > 0 ? "" : "none";
		}

		if (this.quantityInput) {
			this.quantityInput.value = "1";
			this.quantityInput.max = String(Math.max(1, stockDisponible));
		}

		if (this.addCartButton) {
			if (stockDisponible > 0) {
				this.addCartButton.disabled = false;
				this.addCartButton.textContent = "🛒 Añadir al Carro";
			} else {
				this.addCartButton.disabled = true;
				this.addCartButton.textContent = "Producto Agotado";
			}
		}
	}

	attachEvents() {
		if (this.addCartButton) {
			this.addCartButton.addEventListener("click", this.onAddToCart);
		}
	}

	onAddToCart() {
		if (!this.libro) {
			return;
		}

		const stockDisponible = this.libro.stock ?? 0;
		if (stockDisponible <= 0) {
			session.pushError("Este libro está agotado");
			return;
		}

		let cantidad = 1;
		if (this.quantityInput) {
			const parsed = Number.parseInt(this.quantityInput.value, 10);
			if (Number.isFinite(parsed) && parsed > 0) {
				cantidad = parsed;
			}
		}

		cantidad = Math.min(cantidad, stockDisponible);
		this.agregarAlCarro(this.libro.id, cantidad);
	}

	agregarAlCarro(libroId, cantidad) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		const item = carro.find((entry) => entry.libroId === libroId);

		if (item) {
			item.cantidad += cantidad;
		} else {
			carro.push({ libroId, cantidad });
		}

		localStorage.setItem("carro", JSON.stringify(carro));
		session.pushSuccess(`${cantidad} libro(s) añadido(s) al carro`);
		router.navigate("/c/carro");
	}

	toggleSection(key, visible) {
		const section = this.sections?.[key];
		if (!section) {
			return;
		}

		section.style.display = visible ? "" : "none";
	}

	destroy() {
		if (this.addCartButton) {
			this.addCartButton.removeEventListener("click", this.onAddToCart);
		}

		if (typeof super.destroy === "function") {
			super.destroy();
		}
	}
}
