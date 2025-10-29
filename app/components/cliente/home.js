import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';
import { model } from '../../model/index.js';

export class ClienteHome extends Presenter {
    constructor() {
        super(model, 'cliente-home');
    }

    template() {
        const user = session.getUser();
        const librosDestacados = this.model.libros.slice(0, 6);

        return `
            <div class="cliente-home">
                <section class="hero-cliente">
                    <h1>¡Hola, ${user.nombre}!</h1>
                    <p>Descubre nuestra colección de libros</p>
                </section>

                <section class="featured-books">
                    <h2>Libros Destacados</h2>
                    <div class="books-grid">
                        ${librosDestacados.map(libro => `
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
                        `).join('')}
                    </div>
                </section>

                <section class="quick-links">
                    <h2>Accesos Rápidos</h2>
                    <div class="links-grid">
                        <a href="/c/libros" data-link class="link-card">
                            <span class="link-icon">📚</span>
                            <h3>Catálogo Completo</h3>
                        </a>
                        <a href="/c/carro" data-link class="link-card">
                            <span class="link-icon">🛒</span>
                            <h3>Mi Carro</h3>
                        </a>
                        <a href="/c/compras" data-link class="link-card">
                            <span class="link-icon">📦</span>
                            <h3>Mis Compras</h3>
                        </a>
                    </div>
                </section>
            </div>
        `;
    }

    bind() {
        const addButtons = this.container.querySelectorAll('.btn-primary[data-id]');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.agregarAlCarro(id);
            });
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
