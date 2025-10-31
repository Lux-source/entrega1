import { Presenter } from '../../common/presenter.js';
import { router } from '../../common/router.js';
import { session } from '../../common/libreria-session.js';
import { model } from '../../model/index.js';

export class AdminLibros extends Presenter {
    constructor() {
        super(model, 'admin-libros');
    }

    template() {
        const libros = this.model.libros;

        return `
            <div class="admin-libros">
                <div class="page-header">
                    <h1>Gestión de Libros</h1>
                    <a href="/a/libros/nuevo" data-link class="btn btn-primary">
                        ➕ Añadir Nuevo Libro
                    </a>
                </div>

                <div class="table-container">
                    <table class="libros-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Portada</th>
                                <th>Título</th>
                                <th>Autor</th>
                                <th>ISBN</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${libros.map(libro => `
                                <tr>
                                    <td>${libro.id}</td>
                                    <td><img src="${libro.portada}" alt="${libro.titulo}" class="table-img"></td>
                                    <td>${libro.titulo}</td>
                                    <td>${libro.autor}</td>
                                    <td>${libro.isbn}</td>
                                    <td>${libro.precio.toFixed(2)}€</td>
                                    <td>${libro.stock}</td>
                                    <td class="actions">
                                        <a href="/a/libros/editar/${libro.id}" data-link class="btn btn-sm btn-edit">Editar</a>
                                        <button class="btn btn-sm btn-delete" data-id="${libro.id}">Eliminar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    bind() {
        const deleteButtons = this.container.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('¿Estás seguro de eliminar este libro?')) {
                    this.eliminarLibro(id);
                }
            });
        });
    }

    eliminarLibro(id) {
        const index = this.model.libros.findIndex(l => l.id === id);
        if (index !== -1) {
            this.model.libros.splice(index, 1);
            session.pushSuccess('Libro eliminado correctamente');
            this.render();
        }
    }
}
