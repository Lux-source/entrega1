import { Presenter } from "../../common/presenter.js";
import { model } from "../../model/index.js";

export class ClienteCompras extends Presenter {
	constructor() {
		super(model, "cliente-compras");
	}

	template() {
		const compras = JSON.parse(
			localStorage.getItem("compras") || "[]"
		).reverse();

		if (compras.length === 0) {
			return `
                <div class="compras-vacio">
                    <span class="compras-icon">📦</span>
                    <h2>No tienes compras realizadas</h2>
                    <p>Cuando realices una compra, aparecerá aquí</p>
                    <a href="/c" data-link class="btn btn-primary">Explorar catálogo</a>
                </div>
            `;
		}

		return `
            <div class="compras-container">
                <h1>Mis Compras</h1>

                <div class="compras-lista">
                    ${compras
											.map((compra, index) => {
												const fecha = new Date(compra.fecha);
												const subtotal = compra.total || 0;
												const totalIVA = subtotal * 1.21;

												const articulos = (compra.items || [])
													.map((item) => {
														const libro = (this.model.libros || []).find(
															(l) => l.id === item.libroId
														);
														if (!libro) return "";

														const totalLinea = libro.precio * item.cantidad;

														return `
                                        <div class="compra-item">
                                            <img src="${libro.portada}" alt="${
															libro.titulo
														}">
                                            <div class="item-detalle">
                                                <h4>${libro.titulo}</h4>
                                                <p>${libro.autor}</p>
                                                <p class="item-precio-unitario">Precio unitario: ${libro.precio.toFixed(
																									2
																								)}€</p>
                                            </div>
                                            <div class="item-resumen">
                                                <span class="item-cantidad">Cantidad: ${
																									item.cantidad
																								}</span>
                                                <span class="item-total">Total: ${totalLinea.toFixed(
																									2
																								)}€</span>
                                            </div>
                                        </div>
                                    `;
													})
													.join("");

												return `
                                <div class="compra-card">
                                    <div class="compra-header">
                                        <div class="compra-info">
                                            <h3>Pedido #${compra.id}</h3>
                                            <p class="compra-fecha">
                                                ${fecha.toLocaleDateString(
																									"es-ES",
																									{
																										day: "2-digit",
																										month: "long",
																										year: "numeric",
																										hour: "2-digit",
																										minute: "2-digit",
																									}
																								)}
                                            </p>
                                        </div>
                                        <div class="compra-total">
                                            <span class="total-label">Total:</span>
                                            <span class="total-valor">${(
																							compra.total || 0
																						).toFixed(2)}€</span>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-secondary btn-toggle-resumen"
                                            data-index="${index}"
                                            aria-expanded="false">
                                            Ver resumen
                                        </button>
                                    </div>

                                    <div class="compra-resumen" data-index="${index}" hidden>
                                        <div class="compra-resumen-seccion">
                                            <h4>Productos</h4>
                                            <div class="compra-items">
                                                ${
																									articulos ||
																									`<p class="compra-empty">El detalle de los productos ya no está disponible.</p>`
																								}
                                            </div>
                                        </div>
                                        <div class="compra-resumen-seccion">
                                            <h4>Datos de envío</h4>
                                            <ul class="compra-envio">
                                                <li><strong>Nombre:</strong> ${
																									compra.envio?.nombre || ""
																								}</li>
                                                <li><strong>Dirección:</strong> ${
																									compra.envio?.direccion || ""
																								}</li>
                                                <li><strong>Ciudad:</strong> ${
																									compra.envio?.ciudad || ""
																								}</li>
                                                <li><strong>Código Postal:</strong> ${
																									compra.envio?.cp || ""
																								}</li>
                                                <li><strong>Teléfono:</strong> ${
																									compra.envio?.telefono || ""
																								}</li>
                                            </ul>
                                        </div>
                                        <div class="compra-resumen-seccion">
                                            <h4>Totales</h4>
                                            <div class="compra-resumen-totales">
                                                <div><span><strong>Subtotal:</strong></span><span> ${subtotal.toFixed(
																									2
																								)}€</span></div>
                                                <div><span><strong>Total con IVA (21%):</strong></span><span> ${totalIVA.toFixed(
																									2
																								)}€</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
											})
											.join("")}
                </div>
            </div>
        `;
	}

	bind() {
		const botones = this.container.querySelectorAll(".btn-toggle-resumen");
		botones.forEach((btn) => {
			btn.addEventListener("click", () => {
				const index = btn.dataset.index;
				const resumen = this.container.querySelector(
					`.compra-resumen[data-index="${index}"]`
				);
				if (!resumen) {
					return;
				}

				const isHidden = resumen.hasAttribute("hidden");
				if (isHidden) {
					resumen.removeAttribute("hidden");
					btn.setAttribute("aria-expanded", "true");
					btn.textContent = "Ocultar resumen";
				} else {
					resumen.setAttribute("hidden", "");
					btn.setAttribute("aria-expanded", "false");
					btn.textContent = "Ver resumen";
				}
			});
		});
	}
}
