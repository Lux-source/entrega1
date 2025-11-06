// Servicio de Autenticación - Maneja la lógica de autenticación

import { model } from "./seeder.mjs";

class ServicioAutenticacion {
	constructor() {
		this.urlApi = "/api";
	}

	// Inicio de sesión de usuario

	async iniciarSesion(usuario, password, rol) {
		try {
			const email = (usuario || "").trim().toLowerCase();
			const rolNormalizado = (rol || "").toUpperCase();

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

			const candidato = model.usuarios.find(
				(u) => u.email?.toLowerCase() === email
			);

			if (!candidato) {
				return {
					success: false,
					error: "Credenciales inválidas. Verifica email, contraseña y rol.",
				};
			}

			if (candidato.password !== password) {
				return {
					success: false,
					error: "Contraseña incorrecta",
				};
			}

			if (candidato.rol !== rolNormalizado) {
				return {
					success: false,
					error: "Rol incorrecto para este usuario",
				};
			}

			const token = this.generarToken(candidato);

			return {
				success: true,
				usuario: candidato,
				token,
			};
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

			const emailExiste = model.usuarios.some(
				(u) => u.email?.toLowerCase() === emailLimpio
			);
			if (emailExiste) {
				return {
					success: false,
					error: "Este email ya está registrado",
				};
			}

			const dniExiste = model.usuarios.some(
				(u) => u.dni?.toUpperCase() === dniLimpio
			);
			if (dniExiste) {
				return {
					success: false,
					error: "Este DNI ya está registrado",
				};
			}

			const nuevoId = Math.max(...model.usuarios.map((u) => u.id), 0) + 1;
			const { Usuario } = await import("./usuario.mjs");
			const nuevoUsuario = new Usuario(
				nuevoId,
				dniLimpio,
				nombreLimpio,
				apellidosLimpios,
				direccionLimpia,
				telefonoLimpio,
				emailLimpio,
				password,
				rolNormalizado === "ADMIN" ? "ADMIN" : "CLIENTE"
			);

			model.usuarios.push(nuevoUsuario);

			const token = this.generarToken(nuevoUsuario);

			return {
				success: true,
				usuario: nuevoUsuario,
				token,
				message: "¡Registro completado! Bienvenido a la librería.",
			};
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
	 * Generar token (simulado para esta SPA)
	 */
	generarToken(usuario) {
		return `token_${usuario.id}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;
	}

	/**
	 * Verificar si el token es válido
	 */
	verificarToken(token) {
		// Para esta SPA, simplemente verificamos que el token existe
		return !!token && token.startsWith("token_");
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
