import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { model } from "../../model/index.js";
import { Libro } from "../../model/libro.js";

export class AdminLibroForm extends Presenter {
	constructor() {
		super(model, "admin-libro-form");
		this.isEdit = false;
		this.libro = null;
	}

	template() {
		// Detectar si es edición
		const path = window.location.pathname;
		const match = path.match(/\/a\/libros\/editar\/(\d+)/);

		if (match) {
			this.isEdit = true;
			const id = parseInt(match[1]);
			this.libro = this.model.libros.find((l) => l.id === id);

			if (!this.libro) {
				session.pushError("Libro no encontrado");
				router.navigate("/a");
				return "";
			}
		}

		const libro = this.libro || {};
		const cancelHref =
			this.isEdit && this.libro ? `/a/libros/${this.libro.id}` : "/a";

		return `
            <div class="admin-libro-form">
                <div class="page-header">
                    <h1>${this.isEdit ? "Editar Libro" : "Nuevo Libro"}</h1>
                    <a href="/a" data-link class="btn btn-secondary">← Volver</a>
                </div>

                <form id="form-libro" class="libro-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="titulo">Título *</label>
                            <input type="text" id="titulo" name="titulo" 
                                value="${libro.titulo || ""}" required>
                        </div>
                        <div class="form-group">
                            <label for="autor">Autor *</label>
                            <input type="text" id="autor" name="autor" 
                                value="${libro.autor || ""}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="isbn">ISBN *</label>
                            <input type="text" id="isbn" name="isbn" 
                                value="${libro.isbn || ""}" required>
                        </div>
                        <div class="form-group">
                            <label for="editorial">Editorial</label>
                            <input type="text" id="editorial" name="editorial" 
                                value="${libro.editorial || ""}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="precio">Precio (€) *</label>
                            <input type="number" id="precio" name="precio" 
                                step="0.01" min="0" value="${
																	libro.precio || ""
																}" required>
                        </div>
                        <div class="form-group">
                            <label for="stock">Stock *</label>
                            <input type="number" id="stock" name="stock" 
                                min="0" value="${libro.stock || 0}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="anio">Año de publicación</label>
                            <input type="number" id="anio" name="anio" 
                                min="1000" max="2025" value="${
																	libro.anio || ""
																}">
                        </div>
                        <div class="form-group">
                            <label for="paginas">Páginas</label>
                            <input type="number" id="paginas" name="paginas" 
                                min="1" value="${libro.paginas || ""}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="idioma">Idioma</label>
                        <select id="idioma" name="idioma">
                            <option value="Español" ${
															libro.idioma === "Español" ? "selected" : ""
														}>Español</option>
                            <option value="Inglés" ${
															libro.idioma === "Inglés" ? "selected" : ""
														}>Inglés</option>
                            <option value="Francés" ${
															libro.idioma === "Francés" ? "selected" : ""
														}>Francés</option>
                            <option value="Alemán" ${
															libro.idioma === "Alemán" ? "selected" : ""
														}>Alemán</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="portada">URL de la portada *</label>
                        <input type="url" id="portada" name="portada" 
                            value="${libro.portada || ""}" required>
                    </div>

                    <div class="form-group">
                        <label for="descripcion">Descripción</label>
                        <textarea id="descripcion" name="descripcion" rows="4">${
													libro.descripcion || ""
												}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            ${this.isEdit ? "Guardar Cambios" : "Crear Libro"}
                        </button>
						<a href="${cancelHref}" data-link class="btn btn-secondary">Cancelar</a>
                    </div>
                </form>
            </div>
        `;
	}

	bind() {
		const form = this.container.querySelector("#form-libro");
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleSubmit(new FormData(form));
		});
	}

	handleSubmit(formData) {
		const data = {
			titulo: formData.get("titulo"),
			autor: formData.get("autor"),
			isbn: formData.get("isbn"),
			precio: parseFloat(formData.get("precio")),
			stock: parseInt(formData.get("stock")),
			portada: formData.get("portada"),
			descripcion: formData.get("descripcion"),
			editorial: formData.get("editorial"),
			anio: formData.get("anio") ? parseInt(formData.get("anio")) : null,
			paginas: formData.get("paginas")
				? parseInt(formData.get("paginas"))
				: null,
			idioma: formData.get("idioma"),
		};
		let libroId;

		if (this.isEdit) {
			// Actualizar libro existente
			Object.assign(this.libro, data);
			session.pushSuccess("Libro actualizado correctamente");
			libroId = this.libro.id;
		} else {
			// Crear nuevo libro
			const nuevoId = Math.max(...this.model.libros.map((l) => l.id), 0) + 1;
			const nuevoLibro = new Libro(
				nuevoId,
				data.titulo,
				data.autor,
				data.isbn,
				data.precio,
				data.stock,
				data.portada,
				data.descripcion,
				data.editorial,
				data.anio,
				data.paginas,
				data.idioma
			);
			this.model.libros.push(nuevoLibro);
			session.pushSuccess("Libro creado correctamente");
			libroId = nuevoId;
		}

		router.navigate(`/a/libros/${libroId}`);
	}
}
