import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/seeder.mjs";

const templateUrl = new URL("./pago.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar cliente/pago.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml = '<div class="error">No se pudo cargar la vista de pago.</div>';
}

export class ClientePago extends Presenter {
	constructor() {
		super(model, "cliente-pago");
		this.onClick = this.onClick.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();

		if (!this.syncCart()) {
			router.navigate("/c/carro");
			return;
		}

		this.populateForm(session.getUser());
		this.renderView();

		if (this.wrapper) {
			this.wrapper.addEventListener("click", this.onClick);
		}

		if (this.confirmButton) {
			this.confirmButton.addEventListener("click", this.onConfirm);
		}
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.formEnvio = this.container.querySelector("#form-envio");
		this.nombreInput = this.container.querySelector(
			'[data-element="input-nombre"]'
		);
		this.direccionInput = this.container.querySelector(
			'[data-element="input-direccion"]'
		);
		this.telefonoInput = this.container.querySelector(
			'[data-element="input-telefono"]'
		);
		this.itemsEl = this.container.querySelector('[data-element="items"]');
		this.subtotalEl = this.container.querySelector('[data-element="subtotal"]');
		this.shippingEl = this.container.querySelector('[data-element="shipping"]');
		this.totalEl = this.container.querySelector('[data-element="total"]');
		this.totalIvaEl = this.container.querySelector(
			'[data-element="total-iva"]'
		);
		this.confirmButton = this.container.querySelector(
			'[data-element="confirm-button"]'
		);
	}

	syncCart() {
		const raw = session.readScopedArray("carro");
		const sanitized = [];
		const items = [];

		raw.forEach((entry) => {
			const libro = this.model.libros.find((lib) => lib.id === entry.libroId);
			if (!libro) {
				return;
			}

			const stockDisponible = libro.stock ?? 0;
			if (stockDisponible <= 0) {
				return;
			}

			const cantidad = Math.min(
				Math.max(1, Number.parseInt(entry.cantidad, 10) || 1),
				stockDisponible
			);

			sanitized.push({ libroId: libro.id, cantidad });
			items.push({ libro, cantidad });
		});

		if (!items.length) {
			session.writeScopedArray("carro", []);
			return false;
		}

		session.writeScopedArray("carro", sanitized);
		this.cart = sanitized;
		this.items = items;
		return true;
	}

	populateForm(usuario) {
		if (!usuario) {
			return;
		}

		if (this.nombreInput) {
			this.nombreInput.value = usuario.nombre ?? "";
		}

		if (this.direccionInput) {
			this.direccionInput.value = usuario.direccion ?? "";
		}

		if (this.telefonoInput) {
			this.telefonoInput.value = (usuario.telefono ?? "").replace(/\s+/g, "");
		}
	}

	renderView() {
		if (!this.itemsEl) {
			return;
		}

		this.itemsEl.innerHTML = this.items
			.map((item, index) => this.createItemMarkup(item, index))
			.join("");

		const subtotal = this.items.reduce(
			(sum, item) => sum + item.libro.precio * item.cantidad,
			0
		);
		const shipping = 0;
		const total = subtotal + shipping;
		const totalIva = total * 1.21;

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

		if (this.totalIvaEl) {
			this.totalIvaEl.textContent = `${totalIva.toFixed(2)}€`;
		}
	}

	createItemMarkup(item, index) {
		return `
			<div class="resumen-item">
				<img src="${item.libro.portada}" alt="${item.libro.titulo}">
				<div class="item-info">
					<p class="item-titulo">${item.libro.titulo}</p>
					<p class="item-precio-unitario">Precio unitario: ${item.libro.precio.toFixed(
						2
					)}€</p>
				</div>
				<div class="item-acciones">
					<div class="item-cantidad">
						<button type="button" class="btn-cantidad" data-action="decrease" data-index="${index}">-</button>
						<span class="cantidad">${item.cantidad}</span>
						<button type="button" class="btn-cantidad" data-action="increase" data-index="${index}">+</button>
					</div>
				</div>
				<div class="item-total">${(item.libro.precio * item.cantidad).toFixed(2)}€</div>
			</div>
		`;
	}

	onClick(event) {
		const button = event.target.closest(".btn-cantidad");
		if (!button) {
			return;
		}

		const index = Number.parseInt(button.dataset.index, 10);
		const action = button.dataset.action;

		if (!Number.isInteger(index) || !action) {
			return;
		}

		this.actualizarCantidad(index, action);
	}

	actualizarCantidad(index, action) {
		const carro = session.readScopedArray("carro");
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

		if (!carro.length) {
			session.writeScopedArray("carro", []);
			session.pushError("Tu carro quedó vacío. Agrega productos nuevamente.");
			router.navigate("/c/carro");
			return;
		}

		session.writeScopedArray("carro", carro);

		if (!this.syncCart()) {
			router.navigate("/c/carro");
			return;
		}

		this.renderView();
	}

	onConfirm() {
		if (!this.formEnvio) {
			return;
		}

		if (!this.formEnvio.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de envío");
			this.formEnvio.reportValidity();
			return;
		}

		if (!this.syncCart()) {
			session.pushError("Tu carro quedó vacío. Agrega productos nuevamente.");
			router.navigate("/c/carro");
			return;
		}

		const datosEnvio = new FormData(this.formEnvio);

		for (const item of this.cart) {
			const libro = this.model.libros.find((lib) => lib.id === item.libroId);
			if (!libro) {
				continue;
			}

			try {
				libro.reducirStock(item.cantidad);
			} catch (error) {
				console.error(error);
				session.pushError(error.message || "No se pudo procesar el pedido");
				return;
			}
		}

		const compras = session.readScopedArray("compras");
		const subtotal = this.items.reduce(
			(sum, item) => sum + item.libro.precio * item.cantidad,
			0
		);
		const usuario = session.getUser();

		const nuevaCompra = {
			id: Date.now(),
			fecha: new Date().toISOString(),
			items: this.cart,
			total: subtotal,
			usuarioId: usuario?.id ?? null,
			envio: {
				nombre: datosEnvio.get("nombre"),
				direccion: datosEnvio.get("direccion"),
				ciudad: datosEnvio.get("ciudad"),
				cp: datosEnvio.get("cp"),
				telefono: datosEnvio.get("telefono"),
			},
		};

		compras.push(nuevaCompra);
		session.writeScopedArray("compras", compras);
		session.clearScopedItem("carro");

		session.pushSuccess("¡Pago procesado con éxito! Tu pedido está en camino.");
		router.navigate("/c");
	}

	desmontar() {
		if (this.wrapper) {
			this.wrapper.removeEventListener("click", this.onClick);
		}

		if (this.confirmButton) {
			this.confirmButton.removeEventListener("click", this.onConfirm);
		}

		if (this.form) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		super.desmontar();
	}
}
