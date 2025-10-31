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
	}

	procesarPago() {
		const formEnvio = this.container.querySelector("#form-envio");

		// Validar formularios
		if (!formEnvio.checkValidity()) {
			session.pushError("Por favor, completa todos los datos de envío");
			formEnvio.reportValidity();
			return;
		}

		// Obtener datos
		const datosEnvio = new FormData(formEnvio);

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
		};

		compras.push(nuevaCompra);
		localStorage.setItem("compras", JSON.stringify(compras));

		// Vaciar carro
		localStorage.removeItem("carro");

		session.pushSuccess("¡Pago procesado con éxito! Tu pedido está en camino.");
		router.navigate("/c/compras");
	}
}
