import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';
import { model } from '../../model/index.js';

export class AdminHome extends Presenter {
    constructor() {
        super(model, 'admin-home');
    }

    template() {
        const user = session.getUser();
        const totalLibros = this.model.libros.length;
        const totalUsuarios = this.model.usuarios.filter(u => u.rol === 'cliente').length;
        const stockTotal = this.model.libros.reduce((sum, libro) => sum + libro.stock, 0);

        return `
            <div class="admin-container">
                <h1>Panel de Administración</h1>
                <p class="welcome-text">Bienvenido, ${user.nombre}</p>

                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-icon">📚</span>
                        <h3>Total Libros</h3>
                        <p class="stat-number">${totalLibros}</p>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">👥</span>
                        <h3>Clientes</h3>
                        <p class="stat-number">${totalUsuarios}</p>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">📦</span>
                        <h3>Stock Total</h3>
                        <p class="stat-number">${stockTotal}</p>
                    </div>
                </div>

                <div class="admin-menu">
                    <h2>Gestión</h2>
                    <div class="menu-grid">
                        <a href="/a/libros" data-link class="menu-card">
                            <span class="menu-icon">📖</span>
                            <h3>Gestionar Libros</h3>
                            <p>Ver, editar y eliminar libros</p>
                        </a>
                        <a href="/a/libros/nuevo" data-link class="menu-card">
                            <span class="menu-icon">➕</span>
                            <h3>Añadir Libro</h3>
                            <p>Agregar nuevo libro al catálogo</p>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}
