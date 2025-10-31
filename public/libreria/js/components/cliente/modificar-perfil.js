import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";
import { authStore } from "../../model/auth-store.js";
import { authService } from "../../model/auth-service.js";

export class ClienteModificarPerfil extends Presenter {
	constructor() {
		super(model, "cliente-modificar-perfil");
	}

	template() {
		const user = session.getUser();
		if (!user) {
			session.pushError("Sesión no encontrada. Inicia sesión nuevamente.");
			router.navigate("/login");
			return "";
		}

		return `
		<div class="perfil-container">
			<h1>Modificar Perfil</h1>
			<form id="form-modificar-perfil" class="perfil-form">
				<div class="form-row">
					<div class="form-group">
						<label for="id">ID</label>
						<input type="text" id="id" value="${user.id}" disabled>
					</div>
					<div class="form-group">
						<label for="rol">Rol</label>
						<input type="text" id="rol" value="${user.rol}" disabled>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="nombre">Nombre *</label>
						<input type="text" id="nombre" name="nombre" value="${
							user.nombre || ""
						}" required>
					</div>
					<div class="form-group">
						<label for="apellidos">Apellidos *</label>
						<input type="text" id="apellidos" name="apellidos" value="${
							user.apellidos || ""
						}" required>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="dni">DNI *</label>
						<input type="text" id="dni" name="dni" value="${user.dni || ""}" required>
					</div>
					<div class="form-group">
						<label for="email">Email *</label>
						<input type="email" id="email" name="email" value="${
							user.email || ""
						}" required>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="telefono">Teléfono *</label>
						<input type="tel" id="telefono" name="telefono" value="${
							user.telefono || ""
						}" required>
					</div>
					<div class="form-group">
						<label for="direccion">Dirección *</label>
						<input type="text" id="direccion" name="direccion" value="${
							user.direccion || ""
						}" required>
					</div>
				</div>

				<div class="form-group">
					<label for="password">Contraseña *</label>
					<input type="password" id="password" name="password" value="${
						user.password || ""
					}" required>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn btn-primary">Guardar cambios</button>
					<a href="/c/perfil" data-link class="btn btn-secondary">Cancelar</a>
				</div>
			</form>
		</div>
		`;
	}

	bind() {
		const form = this.container.querySelector("#form-modificar-perfil");
		if (form) {
			form.addEventListener("submit", (event) => {
				event.preventDefault();
				this.handleSubmit(new FormData(form));
			});
		}
	}

	handleSubmit(formData) {
		const user = session.getUser();
		if (!user) {
			session.pushError(
				"No se pudo actualizar el perfil. Intenta iniciar sesión nuevamente."
			);
			router.navigate("/login");
			return;
		}

		const nombre = (formData.get("nombre") ?? "").toString().trim();
		const apellidos = (formData.get("apellidos") ?? "").toString().trim();
		const dni = (formData.get("dni") ?? "").toString().trim().toUpperCase();
		const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
		const telefono = (formData.get("telefono") ?? "")
			.toString()
			.replace(/\s+/g, "")
			.trim();
		const direccion = (formData.get("direccion") ?? "").toString().trim();
		const password = (formData.get("password") ?? "").toString();

		if (
			!nombre ||
			!apellidos ||
			!dni ||
			!email ||
			!telefono ||
			!direccion ||
			!password
		) {
			session.pushError("Todos los campos marcados con * son obligatorios.");
			return;
		}

		if (!authService.isValidDni(dni)) {
			session.pushError(
				"DNI inválido. Usa 7-8 dígitos y una letra (ej: 12345678A)"
			);
			return;
		}

		if (!authService.isValidEmail(email)) {
			session.pushError("Email inválido");
			return;
		}

		if (!authService.isValidTelefono(telefono)) {
			session.pushError(
				"Teléfono inválido. Usa solo dígitos (7-15 caracteres)"
			);
			return;
		}

		if (password.length < 6) {
			session.pushError("La contraseña debe tener al menos 6 caracteres");
			return;
		}

		const emailExiste = this.model.usuarios.some(
			(u) => u.id !== user.id && u.email?.toLowerCase() === email
		);
		if (emailExiste) {
			session.pushError("Este email ya está registrado por otro usuario");
			return;
		}

		const dniExiste = this.model.usuarios.some(
			(u) => u.id !== user.id && u.dni?.toUpperCase() === dni
		);
		if (dniExiste) {
			session.pushError("Este DNI ya está registrado por otro usuario");
			return;
		}

		const usuarioModel = this.model.usuarios.find((u) => u.id === user.id);
		if (!usuarioModel) {
			session.pushError("No se encontró el usuario en el sistema");
			return;
		}

		usuarioModel.nombre = nombre;
		usuarioModel.apellidos = apellidos;
		usuarioModel.dni = dni;
		usuarioModel.email = email;
		usuarioModel.telefono = telefono;
		usuarioModel.direccion = direccion;
		usuarioModel.password = password;

		const updatedUser = {
			id: usuarioModel.id,
			dni: usuarioModel.dni,
			nombre: usuarioModel.nombre,
			apellidos: usuarioModel.apellidos,
			direccion: usuarioModel.direccion,
			telefono: usuarioModel.telefono,
			email: usuarioModel.email,
			password: usuarioModel.password,
			rol: usuarioModel.rol,
		};

		session.setUser(updatedUser);
		authStore.updateUser(updatedUser);
		session.pushSuccess("Perfil actualizado correctamente");

		router.navigate("/c/perfil");

		setTimeout(() => {
			window.dispatchEvent(
				new CustomEvent("user-logged-in", { detail: updatedUser })
			);
		}, 100);
	}
}
