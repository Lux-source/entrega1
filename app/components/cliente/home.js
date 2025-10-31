import { Presenter } from "../../common/presenter.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";

export class ClienteHome extends Presenter {
	constructor() {
		super(model, "cliente-home");
		this.currentPage = 1;
		this.itemsPerPage = 12;
	}

	template() {
		const user = session.getUser();
		const totalLibros = this.model.libros.length;
		const totalPages = Math.ceil(totalLibros / this.itemsPerPage) || 1;
		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const librosPaginados = this.model.libros.slice(startIndex, endIndex);

		return `
			<div class="cliente-home">
				<section class="hero cliente-hero">
					<h1>¡Hola, ${user?.nombre ?? "Usuario"}!</h1>
					<p>Descubre nuestra colección de libros</p>
				</section>

				<section class="catalog-section">
					<h2>Catálogo de Libros</h2>
					<p class="catalog-info">Mostrando ${startIndex + 1}-${Math.min(
			endIndex,
			totalLibros
		)} de ${totalLibros} libros</p>

					<div class="books-grid">
						${librosPaginados
							.map(
								(libro) => `
								<div class="book-card">
									<img src="${libro.portada}" alt="${libro.titulo}">
									<h3>${libro.titulo}</h3>
									<p class="author">${libro.autor}</p>
									<p class="price">${libro.precio.toFixed(2)}€</p>
									<div class="card-actions">
										<a href="/c/libros/${libro.id}" data-link class="btn btn-small">Ver detalles</a>
										<button class="btn btn-primary btn-small" data-id="${libro.id}">
											🛒 Añadir
										</button>
									</div>
								</div>
							`
							)
							.join("")}
					</div>

					${
						totalPages > 1
							? `
							<div class="pagination">
								<button class="btn btn-pagination" id="btn-prev" ${
									this.currentPage === 1 ? "disabled" : ""
								}>
									← Anterior
								</button>
								<span class="pagination-info">Página ${this.currentPage} de ${totalPages}</span>
								<button class="btn btn-pagination" id="btn-next" ${
									this.currentPage === totalPages ? "disabled" : ""
								}>
									Siguiente →
								</button>
							</div>
						`
							: ""
					}
				</section>
			</div>
		`;
	}

	bind() {
		const addButtons = this.container.querySelectorAll(".btn-primary[data-id]");
		addButtons.forEach((btn) => {
			btn.addEventListener("click", (event) => {
				const id = Number.parseInt(event.currentTarget.dataset.id, 10);
				if (!Number.isNaN(id)) {
					this.agregarAlCarro(id);
				}
			});
		});

		const btnPrev = this.container.querySelector("#btn-prev");
		const btnNext = this.container.querySelector("#btn-next");

		if (btnPrev) {
			btnPrev.addEventListener("click", () => {
				if (this.currentPage > 1) {
					this.currentPage--;
					this.render();
					window.scrollTo({ top: 0, behavior: "smooth" });
				}
			});
		}

		if (btnNext) {
			btnNext.addEventListener("click", () => {
				const totalPages =
					Math.ceil(this.model.libros.length / this.itemsPerPage) || 1;
				if (this.currentPage < totalPages) {
					this.currentPage++;
					this.render();
					window.scrollTo({ top: 0, behavior: "smooth" });
				}
			});
		}
	}

	agregarAlCarro(libroId) {
		const carro = JSON.parse(localStorage.getItem("carro") || "[]");
		const item = carro.find((i) => i.libroId === libroId);

		if (item) {
			item.cantidad++;
		} else {
			carro.push({ libroId, cantidad: 1 });
		}

		localStorage.setItem("carro", JSON.stringify(carro));
		session.pushSuccess("Libro añadido al carro");
	}
}
