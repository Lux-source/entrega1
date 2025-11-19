import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";
import { cartService } from "../../model/cart-service.mjs";

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
		super(libreriaStore, "cliente-carro");
		this.onClick = this.onClick.bind(this);
		this.items = [];
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		await this.refreshCarro({ force: true });

		if (this.containerEl) {
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

	async refreshCarro({ force = false } = {}) {
		try {
			this.items = await cartService.obtenerCarroDetallado({ force });
		} catch (error) {
			console.error("Error cargando el carro:", error);
			session.pushError(
				error?.message || "No se pudo cargar el carro de la compra"
			);
			this.items = [];
		}
		this.renderCarro();
	}

	renderCarro() {
		if (!this.items.length) {
			if (this.emptySection) {
				this.emptySection.style.display = "";
			}
			if (this.contentSection) {
				this.contentSection.style.display = "none";
			}
			if (this.itemsEl) {
				this.itemsEl.innerHTML = "";
			}
			this.updateTotals({ subtotal: 0, envio: 0, total: 0 });
			return;
		}

		if (this.emptySection) {
			this.emptySection.style.display = "none";
		}
		if (this.contentSection) {
			this.contentSection.style.display = "";
		}

		if (this.itemsEl) {
			this.itemsEl.innerHTML = this.items
				.map((item, index) => this.createItemMarkup(item, index))
				.join("");
		}

		const totales = cartService.calcularTotales(this.items, { envio: 0 });
		this.updateTotals(totales);
	}

	updateTotals({ subtotal = 0, envio = 0, total = 0 }) {
		if (this.subtotalEl) {
			this.subtotalEl.textContent = `${subtotal.toFixed(2)}€`;
		}

		if (this.shippingEl) {
			this.shippingEl.textContent =
				envio === 0 ? "Gratis" : `${envio.toFixed(2)}€`;
		}

		if (this.totalEl) {
			this.totalEl.textContent = `${total.toFixed(2)}€`;
		}
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

	async actualizarCantidad(index, action) {
		const item = this.items[index];
		if (!item) {
			return;
		}

		let nuevaCantidad = item.cantidad;
		if (action === "increase") {
			const stockDisponible = item.libro?.stock ?? 0;
			if (item.cantidad >= stockDisponible) {
				session.pushError("No hay más stock disponible");
				return;
			}
			nuevaCantidad += 1;
		} else {
			nuevaCantidad -= 1;
		}

		try {
			if (nuevaCantidad <= 0) {
				await cartService.eliminarItem({ index });
				session.pushSuccess("Producto eliminado del carro");
			} else {
				await cartService.actualizarCantidad({
					index,
					cantidad: nuevaCantidad,
				});
			}
			await this.refreshCarro({ force: true });
		} catch (error) {
			console.error("Error al actualizar la cantidad:", error);
			session.pushError(error?.message || "No se pudo actualizar la cantidad");
			await this.refreshCarro({ force: true });
		}
	}

	async eliminarItem(index) {
		try {
			await cartService.eliminarItem({ index });
			session.pushSuccess("Producto eliminado del carro");
			await this.refreshCarro({ force: true });
		} catch (error) {
			console.error("Error al eliminar item del carro:", error);
			session.pushError(
				error?.message || "No se pudo eliminar el producto del carro"
			);
			await this.refreshCarro({ force: true });
		}
	}

	desmontar() {
		if (this.containerEl) {
			this.containerEl.removeEventListener("click", this.onClick);
		}
		super.desmontar();
	}
}
