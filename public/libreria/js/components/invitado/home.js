import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { model } from "../../model/index.js";

export class InvitadoHome extends Presenter {
	constructor() {
		super(model, "invitado-home");
		this.currentPage = 1;
		this.itemsPerPage = 12;
	}

	getLibroLink(libro) {
		return `/libros/${libro.id}`;
	}

	heroContent() {
		return `
			<section class="hero">
				<h1>Bienvenido a nuestra Librería Online</h1>
				<p>Descubre miles de libros al mejor precio</p>
				<div class="hero-actions">
					<a href="/login" data-link class="btn btn-primary">Iniciar Sesión</a>
					<a href="/registro" data-link class="btn btn-secondary">Registrarse</a>
				</div>
			</section>
		`;
	}

	template() {
		const totalLibros = this.model.libros.length;
		const totalPages = Math.ceil(totalLibros / this.itemsPerPage);
		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const librosPaginados = this.model.libros.slice(startIndex, endIndex);

		return `
			<div class="invitado-home">
				${this.heroContent()}

                <section class="catalog-section">
                    <h2>Catálogo de Libros</h2>
                    <p class="catalog-info">Mostrando ${
											startIndex + 1
										}-${Math.min(
			endIndex,
			totalLibros
		)} de ${totalLibros} libros</p>
                    
					<div class="books-grid">
						${librosPaginados
							.map(
								(libro) => `
                            <div class="book-card">
                                <img src="${libro.portada}" alt="${
									libro.titulo
								}">
                                <h3>${libro.titulo}</h3>
                                <p class="author">${libro.autor}</p>
                                <p class="price">${libro.precio.toFixed(2)}€</p>
	                                <a href="${this.getLibroLink(
																		libro
																	)}" data-link class="btn btn-small">Ver detalles</a>
                            </div>
                        `
							)
							.join("")}
                    </div>

                    ${
											totalPages > 1
												? `
                        <div class="pagination">
                            <button 
                                class="btn btn-pagination" 
                                id="btn-prev" 
                                ${this.currentPage === 1 ? "disabled" : ""}>
                                ← Anterior
                            </button>
                            <span class="pagination-info">Página ${
															this.currentPage
														} de ${totalPages}</span>
                            <button 
                                class="btn btn-pagination" 
                                id="btn-next" 
                                ${
																	this.currentPage === totalPages
																		? "disabled"
																		: ""
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
				const totalPages = Math.ceil(
					this.model.libros.length / this.itemsPerPage
				);
				if (this.currentPage < totalPages) {
					this.currentPage++;
					this.render();
					window.scrollTo({ top: 0, behavior: "smooth" });
				}
			});
		}
	}
}
