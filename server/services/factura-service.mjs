import { db } from "../data/db-context.mjs";
import { libroService } from "./libro-service.mjs";
import { usuarioService } from "./usuario-service.mjs";

export class FacturaService {
	async obtenerTodas() {
		return await db.obtenerTodos("facturas");
	}

	async obtenerPorId(id) {
		return await db.obtener("facturas", id);
	}

	async obtenerPorNumero(numero) {
		const facturas = await db.obtenerTodos("facturas");
		const normalizado = numero.toString().trim().toUpperCase();
		return (
			facturas.find(
				(f) => f.numero?.toString().trim().toUpperCase() === normalizado
			) || null
		);
	}

	async obtenerPorClienteId(clienteId) {
		const facturas = await db.obtenerTodos("facturas");
		return facturas.filter((f) => f.clienteId === clienteId);
	}

	async crear(datos, { generarNumero = true } = {}) {
		const itemsNormalizados = [];
		let total = 0;

		// Validar items y stock
		for (const item of datos.items || []) {
			const libroId = Number.parseInt(item.libroId ?? item.id ?? 0, 10);
			const cantidad = Number.parseInt(item.cantidad ?? 0, 10);

			if (
				!Number.isFinite(libroId) ||
				!Number.isFinite(cantidad) ||
				cantidad <= 0
			)
				continue;

			const libro = await libroService.obtenerPorId(libroId);
			if (!libro) throw new Error("Libro no encontrado para la compra");

			if (cantidad > libro.stock) {
				throw new Error(`Stock insuficiente para el libro con id ${libro.id}`);
			}

			itemsNormalizados.push({ libroId, cantidad });
			total += libro.precio * cantidad;
		}

		if (datos.total !== undefined) total = datos.total;

		// Actualizar stock
		for (const item of itemsNormalizados) {
			const libro = await libroService.obtenerPorId(item.libroId);
			await libroService.actualizar(libro.id, {
				stock: libro.stock - item.cantidad,
			});
		}

		const factura = {
			numero: generarNumero
				? this._generarNumeroFactura(await db.obtenerTodos("facturas"))
				: datos.numero,
			fecha: datos.fecha ?? new Date().toISOString(),
			clienteId: datos.clienteId ?? null,
			items: itemsNormalizados,
			total,
			envio: datos.envio ?? {},
		};

		const nuevaFactura = await db.agregar("facturas", factura);

		if (nuevaFactura.clienteId) {
			await usuarioService.vaciarCarro(nuevaFactura.clienteId);
		}

		return nuevaFactura;
	}

	_generarNumeroFactura(facturas) {
		const count = facturas.length + 1;
		const numero = String(count).padStart(4, "0");
		return `FAC-${numero}`;
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
