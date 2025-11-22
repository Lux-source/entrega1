// Servicio de Autenticación - Maneja la lógica de autenticación

import { api } from "./api-proxy.mjs";

class ServicioAutenticacion {
	constructor() {
		// Ya no necesitamos urlApi aquí porque api-proxy lo maneja
	}

	// Inicio de sesión de usuario

	async iniciarSesion(usuario, password, rol) {
		try {
			const email = (usuario || "").trim().toLowerCase();
			
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

			// Delegamos la autenticación al servidor a través del proxy
			const result = await api.iniciarSesion(email, password, rol);
			return result;

		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Registro de nuevo usuario
	 */
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
		try {
			const rolesPermitidos = ["ADMIN", "CLIENTE"];
			const dniLimpio = (dni || "").trim().toUpperCase();
			const nombreLimpio = (nombre || "").trim();
			const apellidosLimpios = (apellidos || "").trim();
			const direccionLimpia = (direccion || "").trim();
			const telefonoLimpio = (telefono || "").trim();
			const emailLimpio = (email || "").trim().toLowerCase();
			const rolNormalizado = (rol || "CLIENTE").toUpperCase();

			// Validaciones básicas en cliente
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

			// Delegamos el registro al servidor a través del proxy
			const datosRegistro = {
				dni: dniLimpio,
				nombre: nombreLimpio,
				apellidos: apellidosLimpios,
				direccion: direccionLimpia,
				telefono: telefonoLimpio,
				email: emailLimpio,
				password: password,
				rol: rolNormalizado
			};

			const result = await api.registrar(datosRegistro);
			return result;

		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Validar email
	 */
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

	/**
	 * Cerrar sesión
	 */
	cerrarSesion() {
		return {
			success: true,
			message: "Sesión cerrada correctamente",
		};
	}
}

export const servicioAutenticacion = new ServicioAutenticacion();
