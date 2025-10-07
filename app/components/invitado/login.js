import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';
import { router } from '../../common/router.js';
import { model } from '../../model/index.js';

export class Login extends Presenter {
    constructor() {
        super(model, 'login');
    }

    template() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Iniciar Sesión</h1>
                    <form id="form-login">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Entrar</button>
                    </form>
                    <p class="auth-link">
                        ¿No tienes cuenta? <a href="/registro" data-link>Regístrate aquí</a>
                    </p>
                </div>
            </div>
        `;
    }

    bind() {
        const form = this.container.querySelector('#form-login');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');

            // Buscar usuario
            const usuario = this.model.usuarios.find(u => u.email === email);

            if (!usuario || usuario.password !== password) {
                session.pushError('Email o contraseña incorrectos');
                return;
            }

            session.setUser(usuario);
            session.pushSuccess(`¡Bienvenido, ${usuario.nombre}!`);
            
            // Redirigir según rol
            if (usuario.rol === 'cliente') {
                router.navigate('/c');
            } else if (usuario.rol === 'admin') {
                router.navigate('/a');
            }
        });
    }
}