import { Presenter } from '../../common/presenter.js';
import { session } from '../../common/libreria-session.js';
import { router } from '../../common/router.js';
import { model } from '../../model/index.js';
import { Usuario } from '../../model/usuario.js';

export class Registro extends Presenter {
    constructor() {
        super(model, 'registro');
    }

    template() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Crear Cuenta</h1>
                    <form id="form-registro">
                        <div class="form-group">
                            <label for="nombre">Nombre completo</label>
                            <input type="text" id="nombre" name="nombre" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="password2">Repetir contraseña</label>
                            <input type="password" id="password2" name="password2" required>
                        </div>
                        <div class="form-group">
                            <label for="direccion">Dirección</label>
                            <input type="text" id="direccion" name="direccion" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Registrarse</button>
                    </form>
                    <p class="auth-link">
                        ¿Ya tienes cuenta? <a href="/login" data-link>Inicia sesión aquí</a>
                    </p>
                </div>
            </div>
        `;
    }

    bind() {
        const form = this.container.querySelector('#form-registro');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const password = formData.get('password');
            const password2 = formData.get('password2');

            if (password !== password2) {
                session.pushError('Las contraseñas no coinciden');
                return;
            }

            const email = formData.get('email');
            if (this.model.usuarios.find(u => u.email === email)) {
                session.pushError('El email ya está registrado');
                return;
            }

            const nuevoUsuario = new Usuario(
                this.model.usuarios.length + 1,
                formData.get('nombre'),
                email,
                password,
                'cliente',
                formData.get('direccion')
            );

            this.model.usuarios.push(nuevoUsuario);
            session.pushSuccess('Cuenta creada correctamente. Ya puedes iniciar sesión.');
            router.navigate('/login');
        });
    }
}