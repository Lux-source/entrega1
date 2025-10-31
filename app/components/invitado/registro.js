import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

export class Registro extends Presenter {
	constructor() {
		super(null, "registro");
		this.isLoading = false;
		this.formData = {
			dni: "",
			nombre: "",
			apellidos: "",
			email: "",
			password: "",
			passwordConfirm: "",
			direccion: "",
			telefono: "",
			rol: "CLIENTE",
		};
	}

	template() {
		return `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Crear Cuenta</h1>
                    <p class="auth-subtitle">Únete a nuestra librería</p>

                    <form id="form-registro">
                        <div class="form-group">
                            <label for="dni">DNI *</label>
                            <input
                                type="text"
                                id="dni"
                                name="dni"
                                placeholder="12345678A"
                                autocomplete="off"
                                maxlength="9"
                                required>
                            <small class="form-help">8 dígitos y una letra (ej: 12345678A)</small>
                        </div>

                        <div class="form-group">
                            <label for="nombre">Nombre *</label>
                            <input 
                                type="text" 
                                id="nombre" 
                                name="nombre" 
                                placeholder="Tu nombre completo" 
                                autocomplete="name"
                                minlength="2"
                                required>
                            <small class="form-help">Mínimo 2 caracteres</small>
                        </div>

                        <div class="form-group">
                            <label for="apellidos">Apellidos *</label>
                            <input
                                type="text"
                                id="apellidos"
                                name="apellidos"
                                placeholder="Tus apellidos"
                                autocomplete="family-name"
                                minlength="2"
                                required>
                            <small class="form-help">Introduce tus apellidos completos</small>
                        </div>

                        <div class="form-group">
                            <label for="direccion">Dirección *</label>
                            <input 
                                type="text" 
                                id="direccion" 
                                name="direccion" 
                                placeholder="Tu dirección de entrega" 
                                autocomplete="street-address"
                                required>
                            <small class="form-help">Incluye calle, número y ciudad</small>
                        </div>

                        <div class="form-group">
                            <label for="telefono">Teléfono *</label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                placeholder="600123456"
                                autocomplete="tel"
                                pattern="[0-9]{7,15}"
                                required>
                            <small class="form-help">Solo dígitos, sin espacios ni guiones</small>
                        </div>

                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="correo@ejemplo.com" 
                                autocomplete="email"
                                required>
                            <small class="form-help">Usarás este email para iniciar sesión</small>
                        </div>

                        <div class="form-group">
                            <label for="password">Contraseña *</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                placeholder="Contraseña" 
                                autocomplete="new-password"
                                minlength="6"
                                required>
                            <small class="form-help">Mínimo 6 caracteres</small>
                        </div>

                        <div class="form-group">
                            <label for="passwordConfirm">Confirmar Contraseña *</label>
                            <input 
                                type="password" 
                                id="passwordConfirm" 
                                name="passwordConfirm" 
                                placeholder="Confirma tu contraseña" 
                                autocomplete="new-password"
                                minlength="6"
                                required>
                            <small class="form-help">Debe coincidir con la contraseña anterior</small>
                        </div>

                        <div class="form-group">
                            <label for="rol">Rol *</label>
                            <select id="rol" name="rol" required>
                                <option value="CLIENTE" selected>Cliente</option>
                            </select>
                            <small class="form-help">Por defecto, todas las cuentas nuevas son de tipo Cliente.</small>
                        </div>

                        ${
													this.isLoading
														? `
                            <button type="button" class="btn btn-primary btn-block" disabled>
                                ⏳ Registrando...
                            </button>
                        `
														: `
                            <button type="submit" class="btn btn-primary btn-block">
                                ✓ Crear Cuenta
                            </button>
                        `
												}
                    </form>

                    <div class="auth-divider">o</div>

                    <p class="auth-link">
                        ¿Ya tienes cuenta? <a href="/login" data-link>Inicia sesión aquí</a>
                    </p>

                    <hr class="auth-separator">

                    <div class="terms-info">
                        <p style="font-size: 0.85rem; color: #666;">
                            Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
                        </p>
                    </div>
                </div>
            </div>
        `;
	}

	bind() {
		const form = this.container.querySelector("#form-registro");
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleRegistro(form);
		});

		// Validación en tiempo real
		const passwordInput = form.querySelector("#password");
		const passwordConfirmInput = form.querySelector("#passwordConfirm");
		const dniInput = form.querySelector("#dni");
		const telefonoInput = form.querySelector("#telefono");

		if (dniInput) {
			dniInput.addEventListener("input", () => {
				dniInput.value = dniInput.value
					.replace(/[^0-9a-zA-Z]/g, "")
					.toUpperCase();
			});
		}

		if (telefonoInput) {
			telefonoInput.addEventListener("input", () => {
				telefonoInput.value = telefonoInput.value.replace(/[^0-9]/g, "");
			});
		}

		passwordConfirmInput.addEventListener("input", () => {
			if (
				passwordInput.value !== passwordConfirmInput.value &&
				passwordConfirmInput.value
			) {
				passwordConfirmInput.style.borderColor = "#e74c3c";
			} else {
				passwordConfirmInput.style.borderColor = "";
			}
		});
	}

	async handleRegistro(form) {
		this.isLoading = true;
		this.render(); // Re-renderizar para mostrar loading

		const formData = new FormData(form);
		const datos = {
			dni: formData.get("dni").trim(),
			nombre: formData.get("nombre").trim(),
			apellidos: formData.get("apellidos").trim(),
			direccion: formData.get("direccion").trim(),
			telefono: formData.get("telefono").trim(),
			email: formData.get("email").trim(),
			password: formData.get("password"),
			passwordConfirm: formData.get("passwordConfirm"),
			rol: formData.get("rol") || "CLIENTE",
		};

		// Usar el store para setear loading
		authStore.setLoading(true);

		// Llamar al servicio de autenticación
		const result = await authService.register(
			datos.dni,
			datos.nombre,
			datos.apellidos,
			datos.direccion,
			datos.telefono,
			datos.email,
			datos.password,
			datos.passwordConfirm,
			datos.rol
		);

		if (!result.success) {
			// Error en registro
			authStore.setError(result.error);
			session.pushError(result.error);
			this.isLoading = false;
			this.render();
			return;
		}

		// Registro exitoso: actualizar store SIN location.reload()
		authStore.setLogin(result.usuario, result.token);

		// IMPORTANTE: Sincronizar con el sistema de session viejo
		session.setUser(result.usuario);

		const nombreCompleto = [result.usuario.nombre, result.usuario.apellidos]
			.filter(Boolean)
			.join(" ");

		session.pushSuccess(
			result.message ||
				`¡Bienvenido, ${nombreCompleto || result.usuario.nombre}!`
		);

		// Redirigir a home de cliente después de un pequeño delay
		setTimeout(() => {
			router.navigate("/c");

			// Renderizar navbar para que se actualice sin recarga
			window.dispatchEvent(
				new CustomEvent("user-logged-in", { detail: result.usuario })
			);
		}, 500);
	}
}
