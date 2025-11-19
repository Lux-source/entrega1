import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";
import { cartService } from "../../model/cart-service.mjs";

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
		super(libreriaStore, "cliente-ver-libro");
		this.libro = null;
		this.onAddToCart = this.onAddToCart.bind(this);
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		await this.loadLibro();

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
		this.titleEl = this.container.querySelector('[data-element="title"]');
		this.authorEl = this.container.querySelector('[data-element="author"]');
		this.isbnEl = this.container.querySelector('[data-element="isbn"]');
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
	}

	async loadLibro() {
		const id = this.getLibroIdFromRoute();
		if (!Number.isFinite(id)) {
			this.libro = null;
			return;
		}

		try {
			this.libro = await this.model.getLibroById(id, { force: true });
		} catch (error) {
			console.error("Error cargando libro:", error);
			this.libro = null;
		}
	}

	getLibroIdFromRoute() {
		const match = window.location.pathname.match(/\/c\/libros\/(\d+)/);
		if (!match) {
			return null;
		}
		const id = Number.parseInt(match[1], 10);
		return Number.isFinite(id) ? id : null;
	}

	renderLibro() {
		if (!this.libro || !this.wrapper) {
			return;
		}

		if (this.titleEl) {
			this.titleEl.textContent = this.libro.titulo ?? "Título no disponible";
		}

		if (this.authorEl) {
			this.authorEl.textContent = `por ${
				this.libro.autor ?? "Autor desconocido"
			}`;
		}

		if (this.isbnEl) {
			this.isbnEl.textContent = this.libro.isbn ?? "N/A";
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
				this.addCartButton.textContent = "Añadir al Carro";
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

	async onAddToCart() {
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

		try {
			await cartService.agregarItem({ libroId: this.libro.id, cantidad });
			session.pushSuccess(`${cantidad} libro(s) añadido(s) al carro`);
			router.navigate("/c/carro");
		} catch (error) {
			console.error("Error al añadir al carro:", error);
			session.pushError(
				error?.message || "No se pudo añadir el libro al carro"
			);
		}
	}

	desmontar() {
		if (this.addCartButton) {
			this.addCartButton.removeEventListener("click", this.onAddToCart);
		}

		super.desmontar();
	}
}
