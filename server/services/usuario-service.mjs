import { db } from "../data/db-context.mjs";
import { libroService } from "./libro-service.mjs";
import { Usuario } from "../models/index.mjs";
import mongoose from "mongoose";

const ROL = {
	ADMIN: "ADMIN",
	CLIENTE: "CLIENTE",
};

export class UsuarioService {
	// --- CLIENTES ---
	async obtenerTodosClientes() {
		return await db.obtenerTodos("clientes");
	}

	async obtenerClientePorId(id) {
		return await db.obtener("clientes", id);
	}

	async obtenerClientePorEmail(email) {
		if (!email) return null;
		const usuario = await Usuario.buscarPorEmail(email, "CLIENTE");
		return usuario ? usuario.toJSON() : null;
	}

	async obtenerClientePorDni(dni) {
		if (!dni) return null;
		const usuario = await Usuario.buscarPorDni(dni, "CLIENTE");
		return usuario ? usuario.toJSON() : null;
	}

	async crearCliente(datos) {
		try {
			await this._validarUnicidadCliente(datos);
			const cliente = {
				dni: datos.dni,
				nombre: datos.nombre,
				apellidos: datos.apellidos,
				direccion: datos.direccion,
				telefono: datos.telefono,
				email: datos.email,
				password: datos.password, // Se hasheará automáticamente en el modelo
				rol: ROL.CLIENTE,
			};
			return await db.agregar("clientes", cliente);
		} catch (error) {
			// Manejar errores de duplicados
			if (error.code === 11000) {
				if (error.keyPattern?.email) {
					throw new Error("Email de cliente ya registrado");
				}
				if (error.keyPattern?.dni) {
					throw new Error("DNI de cliente ya registrado");
				}
			}
			throw error;
		}
	}

	async actualizarCliente(id, datos) {
		const cliente = await this.obtenerClientePorId(id);
		if (!cliente) return null;

		// Validar unicidad si se actualizan email o DNI
		if (datos.email && datos.email !== cliente.email) {
			const emailExistente = await this.obtenerClientePorEmail(datos.email);
			if (emailExistente && emailExistente.id !== cliente.id) {
				throw new Error("Email de cliente ya registrado");
			}
		}

		if (datos.dni && datos.dni !== cliente.dni) {
			const dniExistente = await this.obtenerClientePorDni(datos.dni);
			if (dniExistente && dniExistente.id !== cliente.id) {
				throw new Error("DNI de cliente ya registrado");
			}
		}

		try {
			return await db.actualizar("clientes", id, datos);
		} catch (error) {
			if (error.code === 11000) {
				if (error.keyPattern?.email) {
					throw new Error("Email de cliente ya registrado");
				}
				if (error.keyPattern?.dni) {
					throw new Error("DNI de cliente ya registrado");
				}
			}
			throw error;
		}
	}

	async eliminarCliente(id) {
		const eliminado = await db.eliminar("clientes", id);
		if (eliminado) {
			await db.eliminarCarro(id);
		}
		return eliminado;
	}

	async autenticarCliente(email, password) {
		const usuario = await Usuario.autenticar(email, password, "CLIENTE");
		if (!usuario) {
			throw new Error("Credenciales de cliente invalidas");
		}
		return usuario.toJSON();
	}

	async _validarUnicidadCliente(datos) {
		const email = datos.email?.toString().trim().toLowerCase();
		const dni = datos.dni?.toString().trim().toUpperCase();

		if (email && (await this.obtenerClientePorEmail(email))) {
			throw new Error("Email de cliente ya registrado");
		}
		if (dni && (await this.obtenerClientePorDni(dni))) {
			throw new Error("DNI de cliente ya registrado");
		}
	}

	async reemplazarTodosClientes(datosClientes) {
		await db.guardarTodos("clientes", []);
		for (const datos of datosClientes) {
			await this.crearCliente(datos);
		}
		return await this.obtenerTodosClientes();
	}

	async eliminarTodosClientes() {
		const clientes = await this.obtenerTodosClientes();
		for (const c of clientes) {
			await db.eliminarCarro(c.id);
		}
		await db.guardarTodos("clientes", []);
		return [];
	}

	// --- CARRO ---
	async obtenerCarro(clienteId) {
		return await db.obtenerCarro(clienteId);
	}

	async agregarItemCarro(clienteId, item) {
		const cliente = await this.obtenerClientePorId(clienteId);
		if (!cliente) throw new Error("Cliente no encontrado");

		const libro = await libroService.obtenerPorId(item.libroId);
		if (!libro) throw new Error("Libro no encontrado");

		const cantidad = Number.parseInt(item.cantidad ?? 1, 10);
		if (!Number.isFinite(cantidad) || cantidad <= 0)
			throw new Error("Cantidad invalida");

		const carroActual = [...(await db.obtenerCarro(clienteId))];
		const existente = carroActual.find(
			(entry) => entry.libroId.toString() === libro.id.toString()
		);
		const cantidadActual = existente?.cantidad ?? 0;
		const nuevaCantidad = cantidadActual + cantidad;

		if (nuevaCantidad > libro.stock) {
			throw new Error("No hay suficiente stock disponible para el libro");
		}

		if (existente) {
			existente.cantidad = nuevaCantidad;
		} else {
			carroActual.push({ libroId: libro.id, cantidad });
		}

		await db.guardarCarro(clienteId, carroActual);
		return carroActual;
	}

	async actualizarItemCarro(clienteId, index, cantidad) {
		const carroActual = [...(await db.obtenerCarro(clienteId))];
		const posicion = Number.parseInt(index ?? -1, 10);
		const nuevaCantidad = Number.parseInt(cantidad ?? 0, 10);

		if (
			!Number.isFinite(posicion) ||
			posicion < 0 ||
			posicion >= carroActual.length
		) {
			throw new Error("Indice de item invalido");
		}
		if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
			throw new Error("Cantidad invalida");
		}

		const item = carroActual[posicion];
		const libro = await libroService.obtenerPorId(item.libroId);
		if (!libro) throw new Error("Libro no encontrado");

		if (nuevaCantidad > libro.stock) {
			throw new Error("No hay suficiente stock disponible para el libro");
		}

		carroActual[posicion].cantidad = nuevaCantidad;
		await db.guardarCarro(clienteId, carroActual);
		return carroActual;
	}

	async eliminarItemCarro(clienteId, index) {
		const carroActual = [...(await db.obtenerCarro(clienteId))];
		const posicion = Number.parseInt(index ?? -1, 10);

		if (
			!Number.isFinite(posicion) ||
			posicion < 0 ||
			posicion >= carroActual.length
		) {
			throw new Error("Indice de item invalido");
		}

		carroActual.splice(posicion, 1);
		await db.guardarCarro(clienteId, carroActual);
		return carroActual;
	}

	async vaciarCarro(clienteId) {
		await db.eliminarCarro(clienteId);
		return [];
	}

	// --- ADMINS ---
	async obtenerTodosAdmins() {
		return await db.obtenerTodos("admins");
	}

	async obtenerAdminPorId(id) {
		return await db.obtener("admins", id);
	}

	async obtenerAdminPorEmail(email) {
		if (!email) return null;
		const usuario = await Usuario.buscarPorEmail(email, "ADMIN");
		return usuario ? usuario.toJSON() : null;
	}

	async obtenerAdminPorDni(dni) {
		if (!dni) return null;
		const usuario = await Usuario.buscarPorDni(dni, "ADMIN");
		return usuario ? usuario.toJSON() : null;
	}

	async crearAdmin(datos) {
		try {
			const admin = {
				dni: datos.dni,
				nombre: datos.nombre,
				apellidos: datos.apellidos,
				direccion: datos.direccion,
				telefono: datos.telefono,
				email: datos.email,
				password: datos.password, // Se hasheará automáticamente
				rol: ROL.ADMIN,
			};
			return await db.agregar("admins", admin);
		} catch (error) {
			if (error.code === 11000) {
				if (error.keyPattern?.email) {
					throw new Error("Email de administrador ya registrado");
				}
				if (error.keyPattern?.dni) {
					throw new Error("DNI de administrador ya registrado");
				}
			}
			throw error;
		}
	}

	async actualizarAdmin(id, datos) {
		try {
			return await db.actualizar("admins", id, datos);
		} catch (error) {
			if (error.code === 11000) {
				if (error.keyPattern?.email) {
					throw new Error("Email de administrador ya registrado");
				}
				if (error.keyPattern?.dni) {
					throw new Error("DNI de administrador ya registrado");
				}
			}
			throw error;
		}
	}

	async eliminarAdmin(id) {
		return await db.eliminar("admins", id);
	}

	async autenticarAdmin(email, password) {
		const usuario = await Usuario.autenticar(email, password, "ADMIN");
		if (!usuario) {
			throw new Error("Credenciales de administrador invalidas");
		}
		return usuario.toJSON();
	}

	async reemplazarTodosAdmins(datosAdmins) {
		await db.guardarTodos("admins", []);
		for (const datos of datosAdmins) {
			await this.crearAdmin(datos);
		}
		return await this.obtenerTodosAdmins();
	}

	async eliminarTodosAdmins() {
		await db.guardarTodos("admins", []);
		return [];
	}
}

export const usuarioService = new UsuarioService();
