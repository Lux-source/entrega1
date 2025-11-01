import { Presenter } from "../../commons/presenter.mjs";
import { model } from "../../model/index.js";
import { session } from "../../commons/libreria-session.mjs";

export class InvitadoVerLibro extends Presenter {
	constructor() {
		super(model, "invitado-ver-libro");
	}

	template() {
		const path = window.location.pathname;
		const id = parseInt(path.split("/").pop());
		const libro = this.model.libros.find((l) => l.id === id);

		if (!libro) {
			return '<div class="error">Libro no encontrado</div>';
		}

		return `
            <div class="libro-detalle">
                <div class="libro-header">
                    <img src="${libro.portada}" alt="${
			libro.titulo
		}" class="libro-portada">
                    <div class="libro-info">
                        <h1>${libro.titulo}</h1>
                        <p class="autor">Por ${libro.autor}</p>
                        <p class="isbn">ISBN: ${libro.isbn}</p>
                        <p class="precio">${libro.precio.toFixed(2)}€</p>
                        <p class="stock">${
													libro.stock > 0
														? `✓ En stock (${libro.stock} disponibles)`
														: "✗ Agotado"
												}</p>
                        
                        <div class="libro-actions">
                            <a href="/login" data-link class="btn btn-primary">
                                Inicia sesión para comprar
                            </a>
                        </div>
                    </div>
                </div>

                <div class="libro-descripcion">
                    <h2>Descripción</h2>
                    <p>${libro.descripcion || "Sin descripción disponible."}</p>
                </div>

                <div class="libro-detalles">
                    <h3>Detalles del producto</h3>
                    <ul>
                        <li><strong>Editorial:</strong> ${
													libro.editorial || "N/A"
												}</li>
                        <li><strong>Año:</strong> ${libro.anio || "N/A"}</li>
                        <li><strong>Páginas:</strong> ${
													libro.paginas || "N/A"
												}</li>
                        <li><strong>Idioma:</strong> ${
													libro.idioma || "Español"
												}</li>
                    </ul>
                </div>
            </div>
        `;
	}
}
