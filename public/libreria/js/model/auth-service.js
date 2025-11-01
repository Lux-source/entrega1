/**
 * Auth Service - Maneja la lógica de autenticación
 */
import { model } from "./index.js";

class AuthService {
	constructor() {
		this.apiUrl = "/api";
	}

	/**
	 * Login de usuario
	 */
	async login(usuario, password, rol) {
		try {
			const identificador = (usuario || "").trim();
			const rolNormalizado = (rol || "").toUpperCase();

			const candidato = model.usuarios.find((u) => {
				const coincideEmail =
					u.email?.toLowerCase() === identificador.toLowerCase();
				const coincideDni =
					u.dni?.toUpperCase() === identificador.toUpperCase();
				return coincideEmail || coincideDni;
			});

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

			const token = this.generateToken(candidato);

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
	async register(
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

			if (!this.isValidDni(dniLimpio)) {
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

			if (!this.isValidEmail(emailLimpio)) {
				return {
					success: false,
					error: "Email inválido",
				};
			}

			if (!this.isValidTelefono(telefonoLimpio)) {
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
			const { Usuario } = await import("./usuario.js");
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

			const token = this.generateToken(nuevoUsuario);

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
	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	isValidDni(dni) {
		const dniRegex = /^[0-9]{7,8}[A-Z]$/;
		return dniRegex.test(dni);
	}

	isValidTelefono(telefono) {
		const telefonoRegex = /^[0-9]{7,15}$/;
		return telefonoRegex.test(telefono);
	}

	/**
	 * Generar token (simulado para esta SPA)
	 */
	generateToken(usuario) {
		return `token_${usuario.id}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;
	}

	/**
	 * Verificar si el token es válido
	 */
	verifyToken(token) {
		// Para esta SPA, simplemente verificamos que el token existe
		return !!token && token.startsWith("token_");
	}

	/**
	 * Logout
	 */
	logout() {
		return {
			success: true,
			message: "Sesión cerrada correctamente",
		};
	}
}

export const authService = new AuthService();
