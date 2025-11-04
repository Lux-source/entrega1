import { Presenter } from '../../common/presenter.js';
import { model } from '../../model/index.js';
import { session } from '../../common/libreria-session.js';

export class ClienteLibros extends Presenter {
    constructor() {
        super(model, 'cliente-libros');
    }

    template() {
        const libros = this.model.libros;

        return `
            <div class="cliente-libros">
                <h1>Catálogo de Libros</h1>
                
                <div class="filters">
                    <input type="text" id="search" placeholder="Buscar por título o autor..." class="search-input">
                    <select id="filter-genre" class="filter-select">
                        <option value="">Todos los géneros</option>
                        <option value="ficcion">Ficción</option>
                        <option value="no-ficcion">No ficción</option>
                    </select>
                </div>

                <div class="books-grid">
                    ${libros.map(libro => `
                        <div class="book-card" data-titulo="${libro.titulo.toLowerCase()}" data-autor="${libro.autor.toLowerCase()}">
                            <img src="${libro.portada}" alt="${libro.titulo}">
                            <h3>${libro.titulo}</h3>
                            <p class="author">${libro.autor}</p>
                            <p class="price">${libro.precio.toFixed(2)}€</p>
                            <p class="stock ${libro.stock === 0 ? 'out-of-stock' : ''}">
                                ${libro.stock > 0 ? `${libro.stock} disponibles` : 'Agotado'}
                            </p>
                            <div class="card-actions">
                                <a href="/c/libros/${libro.id}" data-link class="btn btn-small">Ver detalles</a>
                                ${libro.stock > 0 ? `
                                    <button class="btn btn-primary btn-small btn-add-cart" data-id="${libro.id}">
                                        🛒 Añadir
                                    </button>
                                ` : `
                                    <button class="btn btn-small" disabled>Agotado</button>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bind() {
        // Búsqueda
        const searchInput = this.container.querySelector('#search');
        searchInput.addEventListener('input', (e) => {
            this.filtrarLibros(e.target.value);
        });

        // Añadir al carro
        const addButtons = this.container.querySelectorAll('.btn-add-cart');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.agregarAlCarro(id);
            });
        });
    }

    filtrarLibros(query) {
        const cards = this.container.querySelectorAll('.book-card');
        const searchTerm = query.toLowerCase();

        cards.forEach(card => {
            const titulo = card.dataset.titulo;
            const autor = card.dataset.autor;
            
            if (titulo.includes(searchTerm) || autor.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    agregarAlCarro(libroId) {
        const carro = JSON.parse(localStorage.getItem('carro') || '[]');
        const item = carro.find(i => i.libroId === libroId);
        
        if (item) {
            item.cantidad++;
        } else {
            carro.push({ libroId, cantidad: 1 });
        }
        
        localStorage.setItem('carro', JSON.stringify(carro));
        session.pushSuccess('Libro añadido al carro');
    }
}
