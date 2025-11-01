import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/index.js";

export class ClientePago extends Presenter {
	constructor() {
		super(model, "cliente-pago");
	}

	template() {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");

		if (carro.length === 0) {
			router.navigate("/c/carro");
			return "";
		}

		const items = carro
			.map((item) => {
				const libro = this.model.libros.find((l) => l.id === item.libroId);
				return { ...item, libro };
			})
			.filter((item) => item.libro);

		const subtotal = items.reduce(
			(sum, item) => sum + item.libro.precio * item.cantidad,
			0
		);
		const envio = 0; // Envío gratuito
		const totalGeneral = subtotal + envio;
		const totalConIVA = totalGeneral * 1.21;
		const usuario = session.getUser();

		return `
			<div class="pago-container">
				<h1>Finalizar Compra</h1>

				<div class="pago-content">
					<div class="pago-forms">
						<div class="form-section">
							<h2>📦 Dirección de Envío</h2>
							<form id="form-envio">
								<div class="form-group">
									<label for="nombre">Nombre completo *</label>
									<input type="text" id="nombre" name="nombre" value="${
										usuario?.nombre || ""
									}" required>
								</div>
								<div class="form-group">
									<label for="direccion">Dirección *</label>
									<input type="text" id="direccion" name="direccion" value="${
										usuario?.direccion || ""
									}" required>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label for="ciudad">Ciudad *</label>
										<input type="text" id="ciudad" name="ciudad" required>
									</div>
									<div class="form-group">
										<label for="cp">Código Postal *</label>
										<input type="text" id="cp" name="cp" pattern="[0-9]{5}" required>
									</div>
								</div>
								<div class="form-group">
									<label for="telefono">Teléfono *</label>
									<input type="tel" id="telefono" name="telefono" pattern="[0-9]{9}" required>
								</div>
							</form>
						</div>
					</div>

					<div class="pago-resumen">
						<h2>Resumen del Pedido</h2>

						<div class="resumen-items">
							${items
								.map(
									(item, index) => `
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
											<button class="btn-cantidad" data-index="${index}" data-action="decrease">-</button>
											<span class="cantidad">${item.cantidad}</span>
											<button class="btn-cantidad" data-index="${index}" data-action="increase">+</button>
										</div>
										
									</div>
									<div class="item-total">${(item.libro.precio * item.cantidad).toFixed(2)}€</div>
								</div>
							`
								)
								.join("")}
						</div>

						<div class="resumen-totales">
							<div class="total-row">
								<span>Subtotal:</span>
								<span>${subtotal.toFixed(2)}€</span>
							</div>
							<div class="total-row">
								<span>Envío:</span>
								<span>${envio === 0 ? "Gratis" : envio.toFixed(2) + "€"}</span>
							</div>
							<div class="total-row">
								<span>Total general:</span>
								<span>${totalGeneral.toFixed(2)}€</span>
							</div>
							<div class="total-row total-final">
								<span>Total con IVA (21%):</span>
								<span>${totalConIVA.toFixed(2)}€</span>
							</div>
						</div>

						<button id="btn-confirmar-pago" class="btn btn-primary btn-block">
							Confirmar y Pagar
						</button>
					</div>
				</div>
			</div>
		`;
	}

	bind() {
		const btnConfirmar = this.container.querySelector("#btn-confirmar-pago");
		if (btnConfirmar) {
			btnConfirmar.addEventListener("click", () => {
				this.procesarPago();
			});
		}

		const btnsCantidad = this.container.querySelectorAll(".btn-cantidad");
		btnsCantidad.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const index = parseInt(e.target.dataset.index, 10);
				const action = e.target.dataset.action;
				this.actualizarCantidad(index, action);
			});
		});

		const btnsRemove = this.container.querySelectorAll(".btn-remove");
		btnsRemove.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const index = parseInt(e.target.dataset.index, 10);
				this.eliminarItem(index);
			});
		});
	}

	procesarPago() {
		const formEnvio = this.container.querySelector("#form-envio");

		if (!formEnvio.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de envío");
			formEnvio.reportValidity();
			return;
		}

		const datosEnvio = new FormData(formEnvio);
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");

		carro.forEach((item) => {
			const libro = this.model.libros.find((l) => l.id === item.libroId);
			if (libro) {
				try {
					libro.reducirStock(item.cantidad);
				} catch (error) {
					session.pushError(`Error: ${error.message}`);
					return;
				}
			}
		});

		const compras = JSON.parse(localStorage.getItem("compras") || "[]");
		const nuevaCompra = {
			id: Date.now(),
			fecha: new Date().toISOString(),
			items: carro,
			total: carro.reduce((sum, item) => {
				const libro = this.model.libros.find((l) => l.id === item.libroId);
				return sum + (libro ? libro.precio * item.cantidad : 0);
			}, 0),
			envio: {
				nombre: datosEnvio.get("nombre"),
				direccion: datosEnvio.get("direccion"),
				ciudad: datosEnvio.get("ciudad"),
				cp: datosEnvio.get("cp"),
				telefono: datosEnvio.get("telefono"),
			},
		};

		compras.push(nuevaCompra);
		localStorage.setItem("compras", JSON.stringify(compras));

		localStorage.removeItem("carro");

		session.pushSuccess("¡Pago procesado con éxito! Tu pedido está en camino.");
		router.navigate("/c");
	}

	actualizarCantidad(index, action) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		const item = carro[index];

		if (!item) {
			return;
		}

		if (action === "increase") {
			const libro = this.model.libros.find((l) => l.id === item.libroId);
			if (!libro) {
				return;
			}
			if (item.cantidad < libro.stock) {
				item.cantidad++;
			} else {
				session.pushError("No hay más stock disponible");
				return;
			}
		} else {
			item.cantidad--;
			if (item.cantidad <= 0) {
				carro.splice(index, 1);
			}
		}

		localStorage.setItem("carro", JSON.stringify(carro));
		this.render();
	}

	eliminarItem(index) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		if (!carro[index]) {
			return;
		}
		carro.splice(index, 1);
		localStorage.setItem("carro", JSON.stringify(carro));
		session.pushSuccess("Producto eliminado del pedido");
		this.render();
	}
}
