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
											.map((compra) => {
												const fecha = new Date(compra.fecha);
												return `
                            <div class="compra-card">
                                <div class="compra-header">
                                    <div class="compra-info">
                                        <h3>Pedido #${compra.id}</h3>
                                        <p class="compra-fecha">${fecha.toLocaleDateString(
																					"es-ES",
																					{
																						day: "2-digit",
																						month: "long",
																						year: "numeric",
																						hour: "2-digit",
																						minute: "2-digit",
																					}
																				)}</p>
                                    </div>
                                    <div class="compra-total">
                                        <span class="total-label">Total:</span>
                                        <span class="total-valor">${compra.total.toFixed(
																					2
																				)}€</span>
                                    </div>
                                </div>

                                <div class="compra-items">
                                    ${compra.items
																			.map((item) => {
																				const libro = this.model.libros.find(
																					(l) => l.id === item.libroId
																				);
																				if (!libro) return "";
																				return `
                                            <div class="compra-item">
                                                <img src="${
																									libro.portada
																								}" alt="${libro.titulo}">
                                                <div class="item-detalle">
                                                    <h4>${libro.titulo}</h4>
                                                    <p>${libro.autor}</p>
                                                    <p class="item-cantidad">Cantidad: ${
																											item.cantidad
																										}</p>
                                                </div>
                                                <div class="item-precio">
                                                    ${(
																											libro.precio *
																											item.cantidad
																										).toFixed(2)}€
                                                </div>
                                            </div>
                                        `;
																			})
																			.join("")}
                                </div>
                            </div>
                        `;
											})
											.join("")}
                </div>
            </div>
        `;
	}
}
