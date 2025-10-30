import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";

export class AdminVerLibro extends Presenter {
	constructor() {
		super(model, "admin-ver-libro");
	}

	template() {
		const path = window.location.pathname;
		const id = parseInt(path.split("/").pop());
		const libro = this.model.libros.find((l) => l.id === id);

		if (!libro) {
			session.pushError("Libro no encontrado");
			router.navigate("/a/libros");
			return "";
		}

		return `
            <div class="ver-libro-admin">
                <div class="page-header">
                    <h1>Detalles del Libro</h1>
                    <div class="header-actions">
                        <a href="/admin-ver-libro/${
													libro.id
												}" data-link class="btn btn-primary">
                            ✏️ Editar
                        </a>
                        <button id="btn-eliminar" class="btn btn-danger">
                            🗑️ Eliminar
                        </button>
                        <a href="/a/libros" data-link class="btn btn-secondary">
                            ← Volver al listado
                        </a>
                    </div>
                </div>

                <div class="libro-detalle-admin">
                    <div class="libro-portada-section">
                        <img src="${libro.portada}" alt="${
			libro.titulo
		}" class="libro-portada-grande">
                        <div class="libro-stats">
                            <div class="stat-card">
                                <span class="stat-label">Stock disponible</span>
                                <span class="stat-value ${
																	libro.stock < 5 ? "low-stock" : ""
																}">${libro.stock}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">Precio</span>
                                <span class="stat-value">${libro.precio.toFixed(
																	2
																)}€</span>
                            </div>
                        </div>
                    </div>

                    <div class="libro-info-section">
                        <h2>${libro.titulo}</h2>
                        <p class="libro-autor">Por ${libro.autor}</p>

                        <div class="libro-detalles">
                            <div class="detalle-item">
                                <span class="detalle-label">ISBN:</span>
                                <span class="detalle-valor">${libro.isbn}</span>
                            </div>
                            ${
															libro.editorial
																? `
                                <div class="detalle-item">
                                    <span class="detalle-label">Editorial:</span>
                                    <span class="detalle-valor">${libro.editorial}</span>
                                </div>
                            `
																: ""
														}
                            ${
															libro.anio
																? `
                                <div class="detalle-item">
                                    <span class="detalle-label">Año:</span>
                                    <span class="detalle-valor">${libro.anio}</span>
                                </div>
                            `
																: ""
														}
                            ${
															libro.paginas
																? `
                                <div class="detalle-item">
                                    <span class="detalle-label">Páginas:</span>
                                    <span class="detalle-valor">${libro.paginas}</span>
                                </div>
                            `
																: ""
														}
                            <div class="detalle-item">
                                <span class="detalle-label">Idioma:</span>
                                <span class="detalle-valor">${
																	libro.idioma || "Español"
																}</span>
                            </div>
                        </div>

                        ${
													libro.descripcion
														? `
                            <div class="libro-descripcion">
                                <h3>Descripción</h3>
                                <p>${libro.descripcion}</p>
                            </div>
                        `
														: ""
												}

                        <div class="libro-admin-info">
                            <div class="info-badge">
                                <span>ID: ${libro.id}</span>
                            </div>
                            ${
															libro.stock < 5
																? `
                                <div class="warning-badge">
                                    ⚠️ Stock bajo - Considere reabastecer
                                </div>
                            `
																: ""
														}
                        </div>
                    </div>
                </div>
            </div>
        `;
	}

	bind() {
		const btnEliminar = this.container.querySelector("#btn-eliminar");
		if (btnEliminar) {
			btnEliminar.addEventListener("click", () => {
				if (
					confirm(
						"¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer."
					)
				) {
					this.eliminarLibro();
				}
			});
		}
	}

	eliminarLibro() {
		const path = window.location.pathname;
		const id = parseInt(path.split("/").pop());
		const index = this.model.libros.findIndex((l) => l.id === id);

		if (index !== -1) {
			this.model.libros.splice(index, 1);
			session.pushSuccess("Libro eliminado correctamente");
			router.navigate("/a/libros");
		} else {
			session.pushError("Error al eliminar el libro");
		}
	}
}
