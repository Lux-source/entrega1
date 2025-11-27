import { db } from "../data/db-context.mjs";
import { libroService } from "./libro-service.mjs";
import { usuarioService } from "./usuario-service.mjs";
import { Factura, Libro } from "../models/index.mjs";
import mongoose from "mongoose";

export class FacturaService {
	async obtenerTodas() {
		return await db.obtenerTodos("facturas");
	}

	async obtenerPorId(id) {
		return await db.obtener("facturas", id);
	}

	async obtenerPorNumero(numero) {
		if (!numero) return null;
		const factura = await Factura.buscarPorNumero(numero.toString().trim());
		return factura ? factura.toJSON() : null;
	}

	async obtenerPorClienteId(clienteId) {
		if (!clienteId || !mongoose.Types.ObjectId.isValid(clienteId)) {
			return [];
		}
		const facturas = await Factura.buscarPorCliente(clienteId);
		return facturas.map((f) => f.toJSON());
	}

	async crear(datos, { generarNumero = true } = {}) {
		// Intentar usar transacciones si están disponibles (replica set)
		let session = null;
		let useTransaction = false;

		// Desactivar transacciones para evitar errores en MongoDB Standalone
		const canUseTransactions = false;

		if (canUseTransactions) {
			try {
				session = await mongoose.startSession();
				await session.startTransaction();
				// Verificar si las transacciones son soportadas realmente (standalone vs replica set)
				await mongoose.connection.db.command({ ping: 1 }, { session });
				useTransaction = true;
			} catch (error) {
				// Transacciones no disponibles (standalone MongoDB), continuar sin ellas
				console.warn(
					"Transacciones no disponibles, ejecutando sin transacción"
				);
				if (session) {
					await session.endSession();
				}
				session = null;
			}
		}

		try {
			const itemsNormalizados = [];
			let total = 0;

			// Validar items y stock
			for (const item of datos.items || []) {
				const libroId = item.libroId?.toString() || item.id?.toString();
				const cantidad = Number.parseInt(item.cantidad ?? 0, 10);

				if (!libroId || !mongoose.Types.ObjectId.isValid(libroId)) {
					throw new Error("ID de libro inválido");
				}

				if (!Number.isFinite(cantidad) || cantidad <= 0) {
					throw new Error("Cantidad inválida");
				}

				const libro = session
					? await Libro.findById(libroId).session(session)
					: await Libro.findById(libroId);
				if (!libro) {
					throw new Error("Libro no encontrado para la compra");
				}

				if (cantidad > libro.stock) {
					throw new Error(`Stock insuficiente para el libro "${libro.titulo}"`);
				}

				itemsNormalizados.push({
					libroId: new mongoose.Types.ObjectId(libroId),
					cantidad,
				});
				total += libro.precio * cantidad;
			}

			if (datos.total !== undefined) {
				total = Number.parseFloat(datos.total);
			}

			// Generar número de factura si es necesario
			let numeroFactura = datos.numero;
			if (generarNumero) {
				numeroFactura = await Factura.generarNumeroFactura();
			}

			// Crear factura
			const factura = new Factura({
				numero: numeroFactura,
				fecha: datos.fecha ?? new Date(),
				clienteId: datos.clienteId,
				items: itemsNormalizados,
				total,
				envio: datos.envio ?? {},
			});

			if (session) {
				await factura.save({ session });
			} else {
				await factura.save();
			}

			// Actualizar stock de los libros
			for (const item of itemsNormalizados) {
				const updateOptions = session ? { session } : {};
				await Libro.updateOne(
					{ _id: item.libroId },
					{ $inc: { stock: -item.cantidad } },
					updateOptions
				);
			}

			// Vaciar carro del cliente si existe
			if (factura.clienteId) {
				await db.eliminarCarro(factura.clienteId.toString());
			}

			// Confirmar transacción si está activa
			if (useTransaction && session) {
				await session.commitTransaction();
			}

			return factura.toJSON();
		} catch (error) {
			// Revertir transacción en caso de error
			if (useTransaction && session) {
				await session.abortTransaction();
			}
			throw error;
		} finally {
			if (session) {
				session.endSession();
			}
		}
	}

	async reemplazarTodas(datosFacturas) {
		await db.guardarTodos("facturas", []);
		for (const datos of datosFacturas) {
			await this.crear(datos, { generarNumero: false });
		}
		return await this.obtenerTodas();
	}

	async eliminarTodas() {
		await db.guardarTodos("facturas", []);
		return [];
	}
}

export const facturaService = new FacturaService();
