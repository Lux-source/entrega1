import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
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
		const total = subtotal + envio;

		const usuario = session.getUser();

		return `
            <div class="pago-container">
                <h1>Finalizar Compra</h1>

                <div class="pago-content">
                    <!-- Formulario de envío -->
                    <div class="pago-forms">
                        <div class="form-section">
                            <h2>📦 Dirección de Envío</h2>
                            <form id="form-envio">
                                <div class="form-group">
                                    <label for="nombre">Nombre completo *</label>
                                    <input type="text" id="nombre" name="nombre" 
                                        value="${
																					usuario?.nombre || ""
																				}" required>
                                </div>
                                <div class="form-group">
                                    <label for="direccion">Dirección *</label>
                                    <input type="text" id="direccion" name="direccion" 
                                        value="${
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
                                        <input type="text" id="cp" name="cp" 
                                            pattern="[0-9]{5}" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="telefono">Teléfono *</label>
                                    <input type="tel" id="telefono" name="telefono" 
                                        pattern="[0-9]{9}" required>
                                </div>
                            </form>
                        </div>

                        <div class="form-section">
                            <h2>💳 Método de Pago</h2>
                            <form id="form-pago">
                                <div class="form-group">
                                    <label>Tipo de tarjeta *</label>
                                    <select id="tipo-tarjeta" name="tipo" required>
                                        <option value="">Selecciona...</option>
                                        <option value="visa">Visa</option>
                                        <option value="mastercard">Mastercard</option>
                                        <option value="amex">American Express</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="numero-tarjeta">Número de tarjeta *</label>
                                    <input type="text" id="numero-tarjeta" name="numero" 
                                        placeholder="1234 5678 9012 3456"
                                        pattern="[0-9]{16}" maxlength="16" required>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="caducidad">Caducidad (MM/AA) *</label>
                                        <input type="text" id="caducidad" name="caducidad" 
                                            placeholder="12/25" pattern="[0-9]{2}/[0-9]{2}" 
                                            maxlength="5" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="cvv">CVV *</label>
                                        <input type="text" id="cvv" name="cvv" 
                                            pattern="[0-9]{3,4}" maxlength="4" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="titular">Titular de la tarjeta *</label>
                                    <input type="text" id="titular" name="titular" 
                                        value="${
																					usuario?.nombre || ""
																				}" required>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Resumen del pedido -->
                    <div class="pago-resumen">
                        <h2>Resumen del Pedido</h2>
                        
                        <div class="resumen-items">
                            ${items
															.map(
																(item) => `
                                <div class="resumen-item">
                                    <img src="${item.libro.portada}" alt="${
																	item.libro.titulo
																}">
                                    <div class="item-info">
                                        <p class="item-titulo">${
																					item.libro.titulo
																				}</p>
                                        <p class="item-cantidad">x${
																					item.cantidad
																				}</p>
                                    </div>
                                    <span class="item-precio">
                                        ${(
																					item.libro.precio * item.cantidad
																				).toFixed(2)}€
                                    </span>
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
                                <span>${
																	envio === 0
																		? "Gratis"
																		: envio.toFixed(2) + "€"
																}</span>
                            </div>
                            <div class="total-row total-final">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}€</span>
                            </div>
                        </div>

                        <button id="btn-confirmar-pago" class="btn btn-primary btn-block">
                            Confirmar y Pagar
                        </button>
                        <a href="/c/carro" data-link class="btn btn-secondary btn-block">
                            Volver al carro
                        </a>

                        <div class="pago-seguro">
                            <span class="icon">🔒</span>
                            <p>Pago seguro garantizado</p>
                        </div>
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

		// Formatear número de tarjeta mientras se escribe
		const inputTarjeta = this.container.querySelector("#numero-tarjeta");
		if (inputTarjeta) {
			inputTarjeta.addEventListener("input", (e) => {
				e.target.value = e.target.value.replace(/\D/g, "");
			});
		}

		// Formatear caducidad
		const inputCaducidad = this.container.querySelector("#caducidad");
		if (inputCaducidad) {
			inputCaducidad.addEventListener("input", (e) => {
				let value = e.target.value.replace(/\D/g, "");
				if (value.length >= 2) {
					value = value.slice(0, 2) + "/" + value.slice(2, 4);
				}
				e.target.value = value;
			});
		}
	}

	procesarPago() {
		const formEnvio = this.container.querySelector("#form-envio");
		const formPago = this.container.querySelector("#form-pago");

		// Validar formularios
		if (!formEnvio.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de envío");
			formEnvio.reportValidity();
			return;
		}

		if (!formPago.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de pago");
			formPago.reportValidity();
			return;
		}

		// Obtener datos
		const datosEnvio = new FormData(formEnvio);
		const datosPago = new FormData(formPago);

		// Validar caducidad
		const caducidad = datosPago.get("caducidad");
		const [mes, año] = caducidad.split("/");
		const fechaCaducidad = new Date(2000 + parseInt(año), parseInt(mes) - 1);
		if (fechaCaducidad < new Date()) {
			session.pushError("La tarjeta ha caducado");
			return;
		}

		// Procesar compra
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");

		// Reducir stock
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

		// Crear compra
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
			pago: {
				tipo: datosPago.get("tipo"),
				ultimos4: datosPago.get("numero").slice(-4),
			},
		};

		compras.push(nuevaCompra);
		localStorage.setItem("compras", JSON.stringify(compras));

		// Vaciar carro
		localStorage.removeItem("carro");

		session.pushSuccess("¡Pago procesado con éxito! Tu pedido está en camino.");
		router.navigate("/c/compras");
	}
}
