import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";

export class ClienteCarro extends Presenter {
	constructor() {
		super(model, "cliente-carro");
	}

	template() {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");

		if (carro.length === 0) {
			return `
                <div class="carro-vacio">
                    <span class="carro-icon">🛒</span>
                    <h2>Tu carro está vacío</h2>
                    <p>¡Explora nuestro catálogo y añade libros!</p>
					<a href="/c" data-link class="btn btn-primary">Ir al catálogo</a>
                </div>
            `;
		}

		const items = carro
			.map((item) => {
				const libro = this.model.libros.find((l) => l.id === item.libroId);
				return { ...item, libro };
			})
			.filter((item) => item.libro);

		const total = items.reduce(
			(sum, item) => sum + item.libro.precio * item.cantidad,
			0
		);

		return `
            <div class="carro-container">
                <h1>Mi Carro de Compras</h1>

                <div class="carro-content">
                    <div class="carro-items">
                        ${items
													.map(
														(item, index) => `
                            <div class="carro-item">
                                <img src="${item.libro.portada}" alt="${
															item.libro.titulo
														}">
                                <div class="item-info">
                                    <h3>${item.libro.titulo}</h3>
                                    <p class="item-autor">${
																			item.libro.autor
																		}</p>
                                    <p class="item-precio">${item.libro.precio.toFixed(
																			2
																		)}€</p>
                                </div>
                                <div class="item-cantidad">
                                    <button class="btn-cantidad" data-index="${index}" data-action="decrease">-</button>
                                    <span class="cantidad">${
																			item.cantidad
																		}</span>
                                    <button class="btn-cantidad" data-index="${index}" data-action="increase">+</button>
                                </div>
                                <div class="item-subtotal">
                                    ${(
																			item.libro.precio * item.cantidad
																		).toFixed(2)}€
                                </div>
                                <button class="btn-remove" data-index="${index}">🗑️</button>
                            </div>
                        `
													)
													.join("")}
                    </div>

                    <div class="carro-resumen">
                        <h2>Resumen del Pedido</h2>
                        <div class="resumen-detalle">
                            <div class="resumen-row">
                                <span>Subtotal:</span>
                                <span>${total.toFixed(2)}€</span>
                            </div>
                            <div class="resumen-row">
                                <span>Envío:</span>
                                <span>Gratis</span>
                            </div>
                            <div class="resumen-row total">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}€</span>
                            </div>
                        </div>
                        <a href="/c/pago" data-link class="btn btn-primary btn-block">
                            Proceder al Pago
                        </a>
						<a href="/c" data-link class="btn btn-secondary btn-block">
                            Seguir Comprando
                        </a>
                    </div>
                </div>
            </div>
        `;
	}

	bind() {
		// Botones de cantidad
		const btnsCantidad = this.container.querySelectorAll(".btn-cantidad");
		btnsCantidad.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const index = parseInt(e.target.dataset.index);
				const action = e.target.dataset.action;
				this.actualizarCantidad(index, action);
			});
		});

		// Botones de eliminar
		const btnsRemove = this.container.querySelectorAll(".btn-remove");
		btnsRemove.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const index = parseInt(e.target.dataset.index);
				this.eliminarItem(index);
			});
		});
	}

	actualizarCantidad(index, action) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");

		if (action === "increase") {
			const libro = this.model.libros.find(
				(l) => l.id === carro[index].libroId
			);
			if (carro[index].cantidad < libro.stock) {
				carro[index].cantidad++;
			} else {
				session.pushError("No hay más stock disponible");
				return;
			}
		} else {
			carro[index].cantidad--;
			if (carro[index].cantidad === 0) {
				carro.splice(index, 1);
			}
		}

		localStorage.setItem("carro", JSON.stringify(carro));
		this.render();
	}

	eliminarItem(index) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		carro.splice(index, 1);
		localStorage.setItem("carro", JSON.stringify(carro));
		session.pushSuccess("Producto eliminado del carro");
		this.render();
	}
}
