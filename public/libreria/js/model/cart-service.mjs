import { session } from "../commons/libreria-session.mjs";
import { libreriaStore } from "./libreria-store.mjs";

const parsePositiveInt = (value) => {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

class CartService {
	constructor(store = libreriaStore) {
		this.store = store;
	}

	_resolveClienteId(clienteId) {
		const id = parsePositiveInt(clienteId);
		if (id) {
			return id;
		}

		const usuario = session.getUser();
		const sessionId = parsePositiveInt(usuario?.id);
		if (!sessionId) {
			throw new Error("Cliente no autenticado");
		}
		return sessionId;
	}

	async obtenerCarro({ clienteId, force = false } = {}) {
		const id = this._resolveClienteId(clienteId);
		const carro = await this.store.getCarroCliente(id, { force });
		return carro.map((item) => ({ ...item }));
	}

	async obtenerCarroDetallado({ clienteId, force = false } = {}) {
		const id = this._resolveClienteId(clienteId);
		const [carro, libros] = await Promise.all([
			this.store.getCarroCliente(id, { force }),
			this.store.getLibros(),
		]);

		return carro
			.map((item) => {
				const libro = libros.find((entry) => entry.id === item.libroId);
				if (!libro) {
					return null;
				}
				return {
					...item,
					libro,
				};
			})
			.filter(Boolean);
	}

	async agregarItem({ clienteId, libroId, cantidad = 1 }) {
		const id = this._resolveClienteId(clienteId);
		const result = await this.store.agregarCarroItem(id, {
			libroId,
			cantidad,
		});
		return result.map((item) => ({ ...item }));
	}

	async actualizarCantidad({ clienteId, index, cantidad }) {
		const id = this._resolveClienteId(clienteId);
		const result = await this.store.actualizarCarroItem(id, index, cantidad);
		return result.map((item) => ({ ...item }));
	}

	async eliminarItem({ clienteId, index }) {
		const id = this._resolveClienteId(clienteId);
		const result = await this.store.eliminarCarroItem(id, index);
		return result.map((item) => ({ ...item }));
	}

	async vaciar({ clienteId }) {
		const id = this._resolveClienteId(clienteId);
		await this.store.vaciarCarro(id);
		return [];
	}

	calcularTotales(items, { envio = 0, iva = 0.21 } = {}) {
		const subtotal = items.reduce((sum, item) => {
			const precio = Number.isFinite(item?.libro?.precio)
				? item.libro.precio
				: 0;
			return sum + precio * (item.cantidad ?? 0);
		}, 0);

		const envioTotal = Number.isFinite(envio) ? envio : 0;
		const total = subtotal + envioTotal;
		const totalIva = total * (1 + iva);

		return {
			subtotal,
			envio: envioTotal,
			total,
			totalConIva: totalIva,
		};
	}
}

export const cartService = new CartService();
export { CartService };
