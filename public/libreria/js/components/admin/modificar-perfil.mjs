import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { libreriaStore } from "../../model/libreria-store.mjs";
import { almacenAutenticacion } from "../../model/auth-store.mjs";
import { servicioAutenticacion } from "../../model/auth-service.mjs";

const templateUrl = new URL("./modificar-perfil.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(
			`Error ${response.status} al cargar admin/modificar-perfil.html`
		);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error">No se pudo cargar la vista de modificación de perfil.</div>';
}

export class AdminModificarPerfil extends Presenter {
	constructor() {
		super(libreriaStore, "admin-modificar-perfil");
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		const user = session.getUser();

		if (!user) {
			session.pushError("Sesión no encontrada. Inicia sesión nuevamente.");
			router.navigate("/login");
			return;
		}

		this.populateForm(user);
		this.attachEvents();
	}

	cacheDom() {
		this.form = this.container.querySelector("#form-modificar-perfil");
		if (!this.form) {
			return;
		}

		this.inputs = {
			id: this.form.querySelector("#id"),
			rol: this.form.querySelector("#rol"),
			nombre: this.form.querySelector("#nombre"),
			apellidos: this.form.querySelector("#apellidos"),
			dni: this.form.querySelector("#dni"),
			email: this.form.querySelector("#email"),
			telefono: this.form.querySelector("#telefono"),
			direccion: this.form.querySelector("#direccion"),
			password: this.form.querySelector("#password"),
		};
	}

	populateForm(user) {
		if (!this.inputs) {
			return;
		}

		if (this.inputs.id) {
			this.inputs.id.value = user.id ?? "";
		}
		if (this.inputs.rol) {
			this.inputs.rol.value = user.rol ?? "ADMIN";
		}

		this.inputs.nombre.value = user.nombre ?? "";
		this.inputs.apellidos.value = user.apellidos ?? "";
		this.inputs.dni.value = user.dni ?? "";
		this.inputs.email.value = user.email ?? "";
		this.inputs.telefono.value = user.telefono ?? "";
		this.inputs.direccion.value = user.direccion ?? "";
		this.inputs.password.value = user.password ?? "";
	}

	attachEvents() {
		if (!this.form) {
			return;
		}

		this.onSubmit = async (event) => {
			event.preventDefault();
			await this.handleSubmit(new FormData(this.form));
		};

		this.form.addEventListener("submit", this.onSubmit);

		if (this.inputs?.dni) {
			this.onDniInput = (event) => {
				event.currentTarget.value = event.currentTarget.value
					.replace(/[^0-9a-zA-Z]/g, "")
					.toUpperCase();
			};
			this.inputs.dni.addEventListener("input", this.onDniInput);
		}

		if (this.inputs?.telefono) {
			this.onTelefonoInput = (event) => {
				event.currentTarget.value = event.currentTarget.value
					.replace(/[^0-9]/g, "")
					.trim();
			};
			this.inputs.telefono.addEventListener("input", this.onTelefonoInput);
		}
	}

	async handleSubmit(formData) {
		const currentUser = session.getUser();
		if (!currentUser) {
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

		if (!servicioAutenticacion.esDniValido(dni)) {
			session.pushError(
				"DNI inválido. Usa 7-8 dígitos y una letra (ej: 12345678A)"
			);
			return;
		}

		if (!servicioAutenticacion.esEmailValido(email)) {
			session.pushError("Email inválido");
			return;
		}

		if (!servicioAutenticacion.esTelefonoValido(telefono)) {
			session.pushError(
				"Teléfono inválido. Usa solo dígitos (7-15 caracteres)"
			);
			return;
		}

		if (password.length < 6) {
			session.pushError("La contraseña debe tener al menos 6 caracteres");
			return;
		}

		try {
			const admins = await this.model.getAdmins({ force: true });
			const emailExiste = admins.some(
				(usuario) =>
					usuario.id !== currentUser.id &&
					usuario.email?.toLowerCase() === email
			);
			if (emailExiste) {
				session.pushError("Este email ya está registrado por otro usuario");
				return;
			}

			const dniExiste = admins.some(
				(usuario) =>
					usuario.id !== currentUser.id && usuario.dni?.toUpperCase() === dni
			);
			if (dniExiste) {
				session.pushError("Este DNI ya está registrado por otro usuario");
				return;
			}

			const updatedUser = await this.model.actualizarAdmin(currentUser.id, {
				nombre,
				apellidos,
				dni,
				email,
				telefono,
				direccion,
				password,
			});

			session.setUser(updatedUser);
			almacenAutenticacion.actualizarUsuario(updatedUser);
			session.pushSuccess("Perfil actualizado correctamente");

			router.navigate("/a/perfil");

			setTimeout(() => {
				window.dispatchEvent(
					new CustomEvent("user-logged-in", { detail: updatedUser })
				);
			}, 100);
		} catch (error) {
			console.error("Error al actualizar perfil de administrador:", error);
			session.pushError(
				error?.message || "No se pudo actualizar el perfil. Intenta nuevamente"
			);
		}
	}

	desmontar() {
		if (this.form && this.onSubmit) {
			this.form.removeEventListener("submit", this.onSubmit);
		}

		if (this.inputs?.dni && this.onDniInput) {
			this.inputs.dni.removeEventListener("input", this.onDniInput);
		}

		if (this.inputs?.telefono && this.onTelefonoInput) {
			this.inputs.telefono.removeEventListener("input", this.onTelefonoInput);
		}

		super.desmontar();
	}
}
