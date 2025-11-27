import { libreriaProxy } from "./libreria-proxy.mjs";
import { libreriaStore } from "./libreria-store.mjs";

class ServicioAutenticacion {

	async iniciarSesion(usuario, password, rol) {
		const email = (usuario || "").trim().toLowerCase();
		const rolNormalizado = (rol || "CLIENTE").toUpperCase();

		if (!email) {
			return {
				success: false,
				error: "El email es obligatorio",
			};
		}

		if (!this.esEmailValido(email)) {
			return {
				success: false,
				error: "Email inválido",
			};
		}

		if (!password) {
			return {
				success: false,
				error: "La contraseña es obligatoria",
			};
		}

		try {
			const payload = { email, password };
			const usuarioAutenticado =
				rolNormalizado === "ADMIN"
					? await libreriaProxy.autenticarAdmin(payload)
					: await libreriaProxy.autenticarCliente(payload);
			const token = this.generarToken(usuarioAutenticado);

			if (rolNormalizado === "ADMIN") {
				await libreriaStore.getAdmins({ force: true });
			} else {
				await libreriaStore.getClientes({ force: true });
			}

			return {
				success: true,
				usuario: usuarioAutenticado,
				token,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message || "Credenciales inválidas",
			};
		}
	}

	async registrar(
		dni,
		nombre,
		apellidos,
		direccion,
		telefono,
		email,
		password,
		passwordConfirm,
		rol = "CLIENTE"
	) {
		const rolesPermitidos = ["ADMIN", "CLIENTE"];
		const dniLimpio = (dni || "").trim().toUpperCase();
		const nombreLimpio = (nombre || "").trim();
		const apellidosLimpios = (apellidos || "").trim();
		const direccionLimpia = (direccion || "").trim();
		const telefonoLimpio = (telefono || "").trim();
		const emailLimpio = (email || "").trim().toLowerCase();
		const rolNormalizado = (rol || "CLIENTE").toUpperCase();

		if (
			!dniLimpio ||
			!nombreLimpio ||
			!apellidosLimpios ||
			!direccionLimpia ||
			!telefonoLimpio ||
			!emailLimpio ||
			!password ||
			!passwordConfirm
		) {
			return {
				success: false,
				error: "Todos los campos son obligatorios",
			};
		}

		if (!this.esDniValido(dniLimpio)) {
			return {
				success: false,
				error: "DNI inválido. Usa 8 dígitos y una letra (ej: 12345678A)",
			};
		}

		if (nombreLimpio.length < 2) {
			return {
				success: false,
				error: "El nombre debe tener al menos 2 caracteres",
			};
		}

		if (apellidosLimpios.length < 2) {
			return {
				success: false,
				error: "Los apellidos deben tener al menos 2 caracteres",
			};
		}

		if (!this.esEmailValido(emailLimpio)) {
			return {
				success: false,
				error: "Email inválido",
			};
		}

		if (!this.esTelefonoValido(telefonoLimpio)) {
			return {
				success: false,
				error: "Teléfono inválido. Usa solo dígitos (7-15 caracteres)",
			};
		}

		if (password.length < 6) {
			return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres",
			};
		}

		if (password !== passwordConfirm) {
			return {
				success: false,
				error: "Las contraseñas no coinciden",
			};
		}

		if (!rolesPermitidos.includes(rolNormalizado)) {
			return {
				success: false,
				error: "Rol inválido. Usa ADMIN o CLIENTE",
			};
		}

		const payload = {
			dni: dniLimpio,
			nombre: nombreLimpio,
			apellidos: apellidosLimpios,
			direccion: direccionLimpia,
			telefono: telefonoLimpio,
			email: emailLimpio,
			password,
			rol: rolNormalizado,
		};

		try {
			const usuarioCreado =
				rolNormalizado === "ADMIN"
					? await libreriaStore.crearAdmin(payload)
					: await libreriaStore.crearCliente(payload);

			const token = this.generarToken(usuarioCreado);

			return {
				success: true,
				usuario: usuarioCreado,
				token,
				message: "¡Registro completado! Bienvenido a la librería.",
			};
		} catch (error) {
			return {
				success: false,
				error: error.message || "No se pudo completar el registro",
			};
		}
	}

	esEmailValido(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	esDniValido(dni) {
		const dniRegex = /^[0-9]{7,8}[A-Z]$/;
		return dniRegex.test(dni);
	}

	esTelefonoValido(telefono) {
		const telefonoRegex = /^[0-9]{7,15}$/;
		return telefonoRegex.test(telefono);
	}

	generarToken(usuario) {
		return `token_${usuario.id}_${Date.now()}_${Math.random()
			.toString(36)
			.slice(2, 9)}`;
	}
	verificarToken(token) {
		return !!token && token.startsWith("token_");
	}

	cerrarSesion() {
		return {
			success: true,
			message: "Sesión cerrada correctamente",
		};
	}
}

export const servicioAutenticacion = new ServicioAutenticacion();
