import { Presenter } from '../../common/presenter.js';
import { router } from '../../common/router.js';
import { model } from '../../model/index.js';

export class InvitadoHome extends Presenter {
    constructor() {
        super(model, 'invitado-home');
    }

    template() {
        const librosDestacados = this.model.libros.slice(0, 6);

        return `
            <div class="invitado-home">
                <section class="hero">
                    <h1>Bienvenido a nuestra Librería Online</h1>
                    <p>Descubre miles de libros al mejor precio</p>
                    <div class="hero-actions">
                        <a href="/login" data-link class="btn btn-primary">Iniciar Sesión</a>
                        <a href="/registro" data-link class="btn btn-secondary">Registrarse</a>
                    </div>
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
                                <a href="/libros/${libro.id}" data-link class="btn btn-small">Ver detalles</a>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="features">
                    <h2>¿Por qué elegirnos?</h2>
                    <div class="features-grid">
                        <div class="feature">
                            <span class="icon">📦</span>
                            <h3>Envío Rápido</h3>
                            <p>Entrega en 24-48h</p>
                        </div>
                        <div class="feature">
                            <span class="icon">💳</span>
                            <h3>Pago Seguro</h3>
                            <p>Múltiples métodos de pago</p>
                        </div>
                        <div class="feature">
                            <span class="icon">📚</span>
                            <h3>Gran Catálogo</h3>
                            <p>Miles de títulos disponibles</p>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
}