import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";

export class ClienteVerLibro extends Presenter {
	constructor() {
		super(model, "cliente-ver-libro");
		this.libro = null;
	}

	template() {
		const path = window.location.pathname;
		const match = path.match(/\/c\/libros\/(\d+)/);

		if (!match) {
			router.navigate("/c");
			return "";
		}

		const id = parseInt(match[1]);
		this.libro = this.model.libros.find((l) => l.id === id);

		if (!this.libro) {
			session.pushError("Libro no encontrado");
			router.navigate("/c");
			return "";
		}

		return `
            <div class="libro-detalle">
                <div class="detalle-header">
					<a href="/c" data-link class="btn btn-secondary">← Volver al catálogo</a>
                </div>

                <div class="detalle-content">
                    <div class="detalle-imagen">
                        <img src="${this.libro.portada}" alt="${
			this.libro.titulo
		}">
                    </div>

                    <div class="detalle-info">
                        <h1>${this.libro.titulo}</h1>
                        <p class="autor">por ${this.libro.autor}</p>
                        
                        <div class="info-grid">
                            ${
															this.libro.editorial
																? `
                                <div class="info-item">
                                    <span class="info-label">Editorial:</span>
                                    <span class="info-value">${this.libro.editorial}</span>
                                </div>
                            `
																: ""
														}
                            ${
															this.libro.anio
																? `
                                <div class="info-item">
                                    <span class="info-label">Año:</span>
                                    <span class="info-value">${this.libro.anio}</span>
                                </div>
                            `
																: ""
														}
                            ${
															this.libro.paginas
																? `
                                <div class="info-item">
                                    <span class="info-label">Páginas:</span>
                                    <span class="info-value">${this.libro.paginas}</span>
                                </div>
                            `
																: ""
														}
                            <div class="info-item">
                                <span class="info-label">Idioma:</span>
                                <span class="info-value">${
																	this.libro.idioma
																}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">ISBN:</span>
                                <span class="info-value">${
																	this.libro.isbn
																}</span>
                            </div>
                        </div>

                        ${
													this.libro.descripcion
														? `
                            <div class="descripcion">
                                <h3>Descripción</h3>
                                <p>${this.libro.descripcion}</p>
                            </div>
                        `
														: ""
												}

                        <div class="compra-info">
                            <div class="precio-stock">
                                <p class="precio-grande">${this.libro.precio.toFixed(
																	2
																)}€</p>
                                <p class="stock ${
																	this.libro.stock === 0 ? "out-of-stock" : ""
																}">
                                    ${
																			this.libro.stock > 0
																				? `${this.libro.stock} disponibles`
																				: "Agotado"
																		}
                                </p>
                            </div>

                            ${
															this.libro.stock > 0
																? `
                                <div class="cantidad-selector">
                                    <label for="cantidad">Cantidad:</label>
                                    <input type="number" id="cantidad" min="1" max="${this.libro.stock}" value="1">
                                </div>
                                <button id="btn-add-cart" class="btn btn-primary btn-large">
                                    🛒 Añadir al Carro
                                </button>
                            `
																: `
                                <button class="btn btn-large" disabled>Producto Agotado</button>
                            `
														}
                        </div>
                    </div>
                </div>
            </div>
        `;
	}

	bind() {
		const btnAddCart = this.container.querySelector("#btn-add-cart");
		if (btnAddCart) {
			btnAddCart.addEventListener("click", () => {
				const cantidad = parseInt(
					this.container.querySelector("#cantidad").value
				);
				this.agregarAlCarro(this.libro.id, cantidad);
			});
		}
	}

	agregarAlCarro(libroId, cantidad) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		const item = carro.find((i) => i.libroId === libroId);

		if (item) {
			item.cantidad += cantidad;
		} else {
			carro.push({ libroId, cantidad });
		}

		localStorage.setItem("carro", JSON.stringify(carro));
		session.pushSuccess(`${cantidad} libro(s) añadido(s) al carro`);
		router.navigate("/c/carro");
	}
}
