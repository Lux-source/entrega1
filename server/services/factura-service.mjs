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
		// Usamos una transacción para asegurar consistencia
		const session = await mongoose.startSession();
		session.startTransaction();

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

				const libro = await Libro.findById(libroId).session(session);
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

			await factura.save({ session });

			// Actualizar stock de los libros
			for (const item of itemsNormalizados) {
				await Libro.updateOne(
					{ _id: item.libroId },
					{ $inc: { stock: -item.cantidad } },
					{ session }
				);
			}

			// Vaciar carro del cliente si existe
			if (factura.clienteId) {
				await db.eliminarCarro(factura.clienteId.toString());
			}

			// Confirmar transacción
			await session.commitTransaction();

			return factura.toJSON();
		} catch (error) {
			// Revertir transacción en caso de error
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
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
