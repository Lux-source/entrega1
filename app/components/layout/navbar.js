import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';
import { router } from '../../common/router.js';

export class Navbar extends Presenter {
    constructor() {
        super(null, 'navbar', 'navbar');
    }

    template() {
        const user = session.getUser();
        const role = session.getRole();

        return `
            <nav class="navbar">
                <div class="navbar-brand">
                    <a href="/" data-link>📚 Librería Online</a>
                </div>
                <div class="navbar-menu">
                    ${role === 'invitado' ? `
                        <a href="/" data-link>Inicio</a>
                        <a href="/login" data-link>Iniciar Sesión</a>
                        <a href="/registro" data-link>Registrarse</a>
                    ` : role === 'cliente' ? `
                        <a href="/c" data-link>Mi Inicio</a>
                        <a href="/c/libros" data-link>Catálogo</a>
                        <a href="/c/carro" data-link>🛒 Carro</a>
                        <a href="/c/compras" data-link>Mis Compras</a>
                        <a href="/c/perfil" data-link>Perfil</a>
                        <button id="btn-logout">Cerrar Sesión</button>
                    ` : `
                        <a href="/a" data-link>Admin Home</a>
                        <a href="/a/libros" data-link>Gestionar Libros</a>
                        <a href="/a/libros/nuevo" data-link>Nuevo Libro</a>
                        <a href="/a/perfil" data-link>Perfil</a>
                        <button id="btn-logout">Cerrar Sesión</button>
                    `}
                </div>
                ${user ? `<div class="navbar-user">👤 ${user.nombre}</div>` : ''}
            </nav>
        `;
    }

    bind() {
        const btnLogout = this.container.querySelector('#btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                session.clearUser();
                session.pushSuccess('Sesión cerrada');
                router.navigate('/');
            });
        }
    }
}