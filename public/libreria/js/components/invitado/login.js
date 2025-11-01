import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

export class Login extends Presenter {
	constructor() {
		super(null, "login");
		this.isLoading = false;
	}

	template() {
		return `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Iniciar Sesión</h1>
                    <p class="auth-subtitle">Accede a tu cuenta</p>

                    <form id="form-login">
                        <div class="form-group">
                            <label for="usuario">Email o DNI *</label>
                            <input type="text" id="usuario" name="usuario" 
                                autocomplete="username"
                                placeholder="correo@ejemplo.com o DNI" required>
                        </div>

                        <div class="form-group">
                            <label for="password">Contraseña *</label>
                            <input type="password" id="password" name="password" 
                                autocomplete="current-password"
                                placeholder="Contraseña" required>
                        </div>

                        <div class="form-group">
                            <label for="rol">Rol *</label>
                            <select id="rol" name="rol" required autocomplete="off">
                                <option value="">-- Selecciona tu rol --</option>
                                <option value="CLIENTE">Cliente</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>

                        ${
													this.isLoading
														? `
                            <button type="button" class="btn btn-primary btn-block" disabled>
                                ⏳ Iniciando sesión...
                            </button>
                        `
														: `
                            <button type="submit" class="btn btn-primary btn-block">
                                🔐 Iniciar Sesión
                            </button>
                        `
												}
                    </form>

                    <div class="auth-divider">o</div>

                    <p class="auth-link">
                        ¿No tienes cuenta? <a href="/registro" data-link>Regístrate aquí</a>
                    </p>

                    <hr class="auth-separator">

                    <div class="demo-credentials">
                        <p><strong>Credenciales de prueba:</strong></p>
                        <div class="demo-item">
                            <p><strong>Admin:</strong> admin@libreria.com / Admin123</p>
                        </div>
                        <div class="demo-item">
                            <p><strong>Cliente:</strong> juan@mail.com / Juanperez123</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
	}

	bind() {
		const form = this.container.querySelector("#form-login");
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleLogin(form);
		});
	}

	async handleLogin(form) {
		this.isLoading = true;
		this.render(); // Re-renderizar para mostrar loading

		const formData = new FormData(form);
		const usuario = formData.get("usuario");
		const password = formData.get("password");
		const rol = formData.get("rol");

		// Usar el store para setear loading
		authStore.setLoading(true);

		// Llamar al servicio de autenticación
		const result = await authService.login(usuario, password, rol);

		if (!result.success) {
			// Error en login
			authStore.setError(result.error);
			session.pushError(result.error);
			this.isLoading = false;
			this.render();
			return;
		}

		// Login exitoso: actualizar store SIN location.reload()
		authStore.setLogin(result.usuario, result.token);

		// IMPORTANTE: Sincronizar con el sistema de session viejo
		session.setUser(result.usuario);

		const nombreCompleto = [result.usuario.nombre, result.usuario.apellidos]
			.filter(Boolean)
			.join(" ");
		session.pushSuccess(
			`¡Bienvenido, ${nombreCompleto || result.usuario.nombre}!`
		);

		// Redirigir según rol
		const redirectUrl = rol === "ADMIN" ? "/a" : "/c";
		router.navigate(redirectUrl);

		// Renderizar navbar para que se actualice sin recarga
		setTimeout(() => {
			window.dispatchEvent(
				new CustomEvent("user-logged-in", { detail: result.usuario })
			);
		}, 100);
	}
}
