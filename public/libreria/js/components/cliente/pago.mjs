import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";
import { cartService } from "../../model/cart-service.mjs";

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
		super(libreriaStore, "cliente-pago");
		this.onClick = this.onClick.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
		this.isSubmitting = false;
		this.items = [];
	}

	template() {
		return templateHtml;
	}

	async bind() {
		this.cacheDom();
		await this.loadCart({ force: true });

		if (!this.items.length) {
			session.pushError(
				"Tu carro está vacío. Agrega productos para continuar."
			);
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
		this.confirmButtonOriginalText =
			this.confirmButton?.textContent?.trim() || "Confirmar y Pagar";
	}

	async loadCart({ force = false } = {}) {
		try {
			this.items = await cartService.obtenerCarroDetallado({ force });
		} catch (error) {
			console.error("Error al cargar el carro para pago:", error);
			session.pushError(
				error?.message || "No se pudo cargar tu carro. Inténtalo de nuevo"
			);
			this.items = [];
		}
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

		const totales = cartService.calcularTotales(this.items, { envio: 0 });

		if (this.subtotalEl) {
			this.subtotalEl.textContent = `${totales.subtotal.toFixed(2)}€`;
		}

		if (this.shippingEl) {
			this.shippingEl.textContent =
				totales.envio === 0 ? "Gratis" : `${totales.envio.toFixed(2)}€`;
		}

		if (this.totalEl) {
			this.totalEl.textContent = `${totales.total.toFixed(2)}€`;
		}

		if (this.totalIvaEl) {
			this.totalIvaEl.textContent = `${totales.totalConIva.toFixed(2)}€`;
		}
	}

	createItemMarkup(item, index) {
		return `
			<div class="resumen-item">
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
			} else {
				await cartService.actualizarCantidad({
					index,
					cantidad: nuevaCantidad,
				});
			}
			await this.loadCart({ force: true });
			if (!this.items.length) {
				session.pushError("Tu carro quedó vacío. Agrega productos nuevamente.");
				router.navigate("/c/carro");
				return;
			}
			this.renderView();
		} catch (error) {
			console.error("Error actualizando cantidad en pago:", error);
			session.pushError(error?.message || "No se pudo actualizar la cantidad");
			await this.loadCart({ force: true });
			if (!this.items.length) {
				router.navigate("/c/carro");
				return;
			}
			this.renderView();
		}
	}

	async onConfirm(event) {
		event?.preventDefault();

		if (this.isSubmitting) {
			return;
		}

		if (!this.formEnvio) {
			return;
		}

		if (!this.formEnvio.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de envio");
			this.formEnvio.reportValidity();
			return;
		}

		await this.loadCart({ force: true });
		if (!this.items.length) {
			session.pushError("Tu carro quedó vacío. Agrega productos nuevamente.");
			router.navigate("/c/carro");
			return;
		}

		const datosEnvio = new FormData(this.formEnvio);
		const totales = cartService.calcularTotales(this.items, { envio: 0 });
		const usuario = session.getUser();
		const clienteId = Number.parseInt(usuario?.id ?? "", 10) || null;

		const compraPayload = {
			items: this.items.map((item) => ({
				libroId: item.libroId,
				cantidad: item.cantidad,
			})),
			total: totales.subtotal,
			clienteId,
			envio: {
				nombre: (datosEnvio.get("nombre") || "").trim(),
				direccion: (datosEnvio.get("direccion") || "").trim(),
				ciudad: (datosEnvio.get("ciudad") || "").trim(),
				cp: (datosEnvio.get("cp") || "").trim(),
				telefono: (datosEnvio.get("telefono") || "").trim(),
			},
		};

		this.setSubmittingState(true);

		try {
			await this.model.crearFactura(compraPayload);
			await cartService.vaciar({});
			session.pushSuccess(
				"Pago procesado con éxito. Tu pedido está en camino."
			);
			router.navigate("/c");
		} catch (error) {
			console.error("Error al registrar la compra:", error);
			const mensajeError =
				error?.message || "No se pudo registrar la compra. Intenta nuevamente.";
			session.pushError(mensajeError);
		} finally {
			this.setSubmittingState(false);
		}
	}

	setSubmittingState(isSubmitting) {
		this.isSubmitting = isSubmitting;
		if (!this.confirmButton) {
			return;
		}

		this.confirmButton.disabled = isSubmitting;
		this.confirmButton.textContent = isSubmitting
			? "Procesando..."
			: this.confirmButtonOriginalText;
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
