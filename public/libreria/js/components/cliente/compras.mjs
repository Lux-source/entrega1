import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/seeder.mjs";

const templateUrl = new URL("./compras.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar cliente/compras.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de compras.</div>';
}

export class ClienteCompras extends Presenter {
	constructor() {
		super(model, "cliente-compras");
		this.onToggleClick = this.onToggleClick.bind(this);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderCompras();

		if (this.wrapper) {
			this.wrapper.addEventListener("click", this.onToggleClick);
		}
	}

	obtenerComprasDelUsuario() {
		const usuario = session.getUser();
		if (!usuario) {
			return [];
		}

		// Obtener compras del modelo del servidor
		const compras = this.model.getComprasPorUsuario(usuario.id);
		return compras;
	}

	cacheDom() {
		this.wrapper = this.container.querySelector('[data-element="wrapper"]');
		this.emptySection = this.container.querySelector('[data-section="empty"]');
		this.contentSection = this.container.querySelector(
			'[data-section="content"]'
		);
		this.listEl = this.container.querySelector('[data-element="list"]');
	}

	renderCompras() {
		// Obtener compras del modelo del servidor y filtrar por usuario
		const compras = [...this.obtenerComprasDelUsuario()].reverse();

		if (!compras.length) {
			if (this.emptySection) {
				this.emptySection.style.display = "";
			}
			if (this.contentSection) {
				this.contentSection.style.display = "none";
			}
			return;
		}

		if (this.emptySection) {
			this.emptySection.style.display = "none";
		}
		if (this.contentSection) {
			this.contentSection.style.display = "";
		}

		if (this.listEl) {
			this.listEl.innerHTML = compras
				.map((compra, index) => this.createCompraMarkup(compra, index))
				.join("");
		}
	}

	createCompraMarkup(compra, index) {
		const fecha = new Date(compra.fecha);
		const subtotal = compra.total || 0;
		const totalIVA = subtotal * 1.21;

		const articulos = (compra.items || [])
			.map((item) => {
				const libro = (this.model.libros || []).find(
					(lib) => lib.id === item.libroId
				);
				if (!libro) {
					return "";
				}

				const totalLinea = libro.precio * item.cantidad;
				return `
					<div class="compra-item">
						<div class="item-detalle">
							<h4>${libro.titulo}</h4>
							<p>${libro.autor}</p>
							<p class="item-precio-unitario">Precio unitario: ${libro.precio.toFixed(2)}€</p>
						</div>
						<div class="item-resumen">
							<span class="item-cantidad">Cantidad: ${item.cantidad}</span>
							<span class="item-total">Total: ${totalLinea.toFixed(2)}€</span>
						</div>
					</div>
				`;
			})
			.join("");

		const articulosHtml =
			articulos ||
			`<p class="compra-empty">El detalle de los productos ya no está disponible.</p>`;

		const fechaFormateada = fecha.toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		return `
			<div class="compra-card">
				<div class="compra-header">
					<div class="compra-info">
						<h3>Pedido #${compra.id}</h3>
						<p class="compra-fecha">${fechaFormateada}</p>
					</div>
					<div class="compra-total">
						<span class="total-label">Total:</span>
						<span class="total-valor">${(compra.total || 0).toFixed(2)}€</span>
					</div>
					<button type="button" class="btn btn-secondary btn-toggle-resumen" data-index="${index}" aria-expanded="false">
						Ver resumen
					</button>
				</div>
				<div class="compra-resumen" data-index="${index}" hidden>
					<div class="compra-resumen-seccion">
						<h4>Productos</h4>
						<div class="compra-items">
							${articulosHtml}
						</div>
					</div>
					<div class="compra-resumen-seccion">
						<h4>Datos de envío</h4>
						<ul class="compra-envio">
							<li><strong>Nombre:</strong> ${compra.envio?.nombre || ""}</li>
							<li><strong>Dirección:</strong> ${compra.envio?.direccion || ""}</li>
							<li><strong>Ciudad:</strong> ${compra.envio?.ciudad || ""}</li>
							<li><strong>Código Postal:</strong> ${compra.envio?.cp || ""}</li>
							<li><strong>Teléfono:</strong> ${compra.envio?.telefono || ""}</li>
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
	}

	onToggleClick(event) {
		const button = event.target.closest(".btn-toggle-resumen");
		if (!button) {
			return;
		}

		const index = button.dataset.index;
		const resumen = this.container.querySelector(
			`.compra-resumen[data-index="${index}"]`
		);
		if (!resumen) {
			return;
		}

		const isHidden = resumen.hasAttribute("hidden");
		if (isHidden) {
			resumen.removeAttribute("hidden");
			button.setAttribute("aria-expanded", "true");
			button.textContent = "Ocultar resumen";
		} else {
			resumen.setAttribute("hidden", "");
			button.setAttribute("aria-expanded", "false");
			button.textContent = "Ver resumen";
		}
	}

	desmontar() {
		if (this.wrapper) {
			this.wrapper.removeEventListener("click", this.onToggleClick);
		}

		super.desmontar();
	}
}
