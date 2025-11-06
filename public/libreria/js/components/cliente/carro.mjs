import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/seeder.mjs";

const templateUrl = new URL("./carro.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar cliente/carro.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista del carro.</div>';
}

export class ClienteCarro extends Presenter {
	constructor() {
		super(model, "cliente-carro");
		this.onClick = this.onClick.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderCarro();

		if (this.containerEl) {
			// Prevent duplicated handlers if bind runs more than once on same instance
			this.containerEl.removeEventListener("click", this.onClick);
			this.containerEl.addEventListener("click", this.onClick);
		}
	}

	cacheDom() {
		this.containerEl = this.container;
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.emptySection = this.container.querySelector('[data-section="empty"]');
		this.contentSection = this.container.querySelector(
			'[data-section="content"]'
		);
		this.itemsEl = this.container.querySelector('[data-element="items"]');
		this.subtotalEl = this.container.querySelector('[data-element="subtotal"]');
		this.shippingEl = this.container.querySelector('[data-element="shipping"]');
		this.totalEl = this.container.querySelector('[data-element="total"]');
	}

	renderCarro() {
		const carroRaw = session.leerArrayClienteSesion("carro");
		const items = carroRaw
			.map((entry) => {
				const libro = this.model.libros.find((lib) => lib.id === entry.libroId);
				return libro ? { ...entry, libro } : null;
			})
			.filter(Boolean);

		if (items.length === 0) {
			if (this.emptySection) {
				this.emptySection.style.display = "";
			}
			if (this.contentSection) {
				this.contentSection.style.display = "none";
			}
			session.escribirArrayClienteSesion("carro", []);
			return;
		}

		if (this.emptySection) {
			this.emptySection.style.display = "none";
		}
		if (this.contentSection) {
			this.contentSection.style.display = "";
		}

		if (this.itemsEl) {
			this.itemsEl.innerHTML = items
				.map((item, index) => this.createItemMarkup(item, index))
				.join("");
		}

		const subtotal = items.reduce(
			(sum, item) => sum + item.libro.precio * item.cantidad,
			0
		);
		const shipping = 0;
		const total = subtotal + shipping;

		if (this.subtotalEl) {
			this.subtotalEl.textContent = `${subtotal.toFixed(2)}€`;
		}

		if (this.shippingEl) {
			this.shippingEl.textContent =
				shipping === 0 ? "Gratis" : `${shipping.toFixed(2)}€`;
		}

		if (this.totalEl) {
			this.totalEl.textContent = `${total.toFixed(2)}€`;
		}

		this.cartItems = items;

		session.escribirArrayClienteSesion(
			"carro",
			items.map((item) => ({
				libroId: item.libroId,
				cantidad: item.cantidad,
			}))
		);
	}

	createItemMarkup(item, index) {
		return `
			<div class="carro-item">
				<div class="item-info">
					<h3>${item.libro.titulo}</h3>
					<p class="item-autor">${item.libro.autor}</p>
					<p class="item-precio">${item.libro.precio.toFixed(2)}€</p>
				</div>
				<div class="item-cantidad">
					<button type="button" class="btn-cantidad" data-action="decrease" data-index="${index}">-</button>
					<span class="cantidad">${item.cantidad}</span>
					<button type="button" class="btn-cantidad" data-action="increase" data-index="${index}">+</button>
				</div>
				<div class="item-subtotal">${(item.libro.precio * item.cantidad).toFixed(
					2
				)}€</div>
				<button type="button" class="btn-remove" data-index="${index}">Eliminar</button>
			</div>
		`;
	}

	onClick(event) {
		const cantidadBtn = event.target.closest(".btn-cantidad");
		if (cantidadBtn) {
			const index = Number.parseInt(cantidadBtn.dataset.index, 10);
			const action = cantidadBtn.dataset.action;
			if (Number.isInteger(index) && action) {
				this.actualizarCantidad(index, action);
			}
			return;
		}

		const removeBtn = event.target.closest(".btn-remove");
		if (removeBtn) {
			const index = Number.parseInt(removeBtn.dataset.index, 10);
			if (Number.isInteger(index)) {
				this.eliminarItem(index);
			}
		}
	}

	actualizarCantidad(index, action) {
		const carro = session.leerArrayClienteSesion("carro");
		const item = carro[index];

		if (!item) {
			return;
		}

		if (action === "increase") {
			const libro = this.model.libros.find((lib) => lib.id === item.libroId);
			if (!libro) {
				return;
			}
			if (item.cantidad < (libro.stock ?? 0)) {
				item.cantidad += 1;
			} else {
				session.pushError("No hay más stock disponible");
				return;
			}
		} else {
			item.cantidad -= 1;
			if (item.cantidad <= 0) {
				carro.splice(index, 1);
			}
		}

		session.escribirArrayClienteSesion("carro", carro);
		this.renderCarro();
	}

	eliminarItem(index) {
		const carro = session.leerArrayClienteSesion("carro");
		if (!carro[index]) {
			return;
		}

		carro.splice(index, 1);
		session.escribirArrayClienteSesion("carro", carro);
		session.pushSuccess("Producto eliminado del carro");
		this.renderCarro();
	}

	desmontar() {
		if (this.containerEl) {
			this.containerEl.removeEventListener("click", this.onClick);
		}
		super.desmontar();
	}
}
