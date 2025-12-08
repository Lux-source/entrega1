import { libreriaProxy } from "./libreria-proxy.mjs";

const clone = (data) => {
	if (Array.isArray(data)) {
		return data.map((item) =>
			typeof structuredClone === "function"
				? structuredClone(item)
				: JSON.parse(JSON.stringify(item))
		);
	}
	if (data && typeof data === "object") {
		return typeof structuredClone === "function"
			? structuredClone(data)
			: JSON.parse(JSON.stringify(data));
	}
	return data;
};

class LibreriaStore {
	constructor(proxy = libreriaProxy) {
		this.proxy = proxy;
		this.cache = {
			libros: [],
			clientes: [],
			admins: [],
			facturas: [],
			carros: new Map(),
		};
		this.flags = {
			librosLoaded: false,
			clientesLoaded: false,
			adminsLoaded: false,
			facturasLoaded: false,
		};
	}

	async getLibros({ force = false } = {}) {
		if (!this.flags.librosLoaded || force) {
			this.cache.libros = await this.proxy.getLibros();
			this.flags.librosLoaded = true;
		}
		return clone(this.cache.libros);
	}

	async getLibroById(id, { force = false } = {}) {
		const stringId = String(id ?? "").trim();
		if (!stringId) {
			return null;
		}

		if (!force && this.flags.librosLoaded) {
			const match = this.cache.libros.find((libro) => libro.id === stringId);
			if (match) {
				return clone(match);
			}
		}

		const libro = await this.proxy.getLibroPorId(stringId);
		this._upsertLibro(libro);
		return clone(libro);
	}

	async crearLibro(payload) {
		const libro = await this.proxy.crearLibro(payload);
		this._upsertLibro(libro);
		return clone(libro);
	}

	async actualizarLibro(id, payload) {
		const libro = await this.proxy.actualizarLibro(id, payload);
		this._upsertLibro(libro);
		return clone(libro);
	}

	async borrarLibro(id) {
		await this.proxy.borrarLibro(id);
		const stringId = String(id ?? "").trim();
		if (stringId) {
			this.cache.libros = this.cache.libros.filter(
				(libro) => libro.id !== stringId
			);
		}
		return true;
	}

	_upsertLibro(libro) {
		if (!libro) {
			return;
		}
		const index = this.cache.libros.findIndex((entry) => entry.id === libro.id);
		if (index >= 0) {
			this.cache.libros.splice(index, 1, libro);
		} else {
			this.cache.libros.push(libro);
		}
	}

	async getClientes({ force = false } = {}) {
		if (!this.flags.clientesLoaded || force) {
			this.cache.clientes = await this.proxy.getClientes();
			this.flags.clientesLoaded = true;
		}
		return clone(this.cache.clientes);
	}

	async getClienteById(id, { force = false } = {}) {
		const stringId = String(id ?? "").trim();
		if (!stringId) {
			return null;
		}

		if (!force && this.flags.clientesLoaded) {
			const match = this.cache.clientes.find(
				(cliente) => cliente.id === stringId
			);
			if (match) {
				return clone(match);
			}
		}

		const cliente = await this.proxy.getClientePorId(stringId);
		this._upsertCliente(cliente);
		return clone(cliente);
	}

	async crearCliente(payload) {
		const cliente = await this.proxy.agregarCliente(payload);
		this._upsertCliente(cliente);
		return clone(cliente);
	}

	async actualizarCliente(id, payload) {
		const cliente = await this.proxy.actualizarCliente(id, payload);
		this._upsertCliente(cliente);
		return clone(cliente);
	}

	async borrarCliente(id) {
		await this.proxy.borrarCliente(id);
		const stringId = String(id ?? "").trim();
		if (stringId) {
			this.cache.clientes = this.cache.clientes.filter(
				(cliente) => cliente.id !== stringId
			);
			this.cache.carros.delete(stringId);
		}
		return true;
	}

	_upsertCliente(cliente) {
		if (!cliente) {
			return;
		}
		const index = this.cache.clientes.findIndex(
			(entry) => entry.id === cliente.id
		);
		if (index >= 0) {
			this.cache.clientes.splice(index, 1, cliente);
		} else {
			this.cache.clientes.push(cliente);
		}
	}

	async getCarroCliente(clienteId, { force = false } = {}) {
		const id = String(clienteId ?? "").trim();
		if (!id) {
			return [];
		}

		if (!force && this.cache.carros.has(id)) {
			return clone(this.cache.carros.get(id));
		}

		const carro = await this.proxy.getCarroCliente(id);
		this.cache.carros.set(id, Array.isArray(carro) ? carro : []);
		return clone(this.cache.carros.get(id));
	}

	async agregarCarroItem(clienteId, { libroId, cantidad }) {
		const id = String(clienteId ?? "").trim();
		if (!id) {
			throw new Error("Id de cliente invalido");
		}
		const carro = await this.proxy.agregarItemCarro(id, {
			libroId,
			cantidad,
		});
		this.cache.carros.set(id, Array.isArray(carro) ? carro : []);
		return clone(this.cache.carros.get(id));
	}

	async actualizarCarroItem(clienteId, index, cantidad) {
		const id = String(clienteId ?? "").trim();
		const posicion = Number.parseInt(index ?? "", 10);
		if (!id || !Number.isFinite(posicion) || posicion < 0) {
			throw new Error("Parametros invalidos");
		}
		const carro = await this.proxy.actualizarCantidadCarro(
			id,
			posicion,
			cantidad
		);
		this.cache.carros.set(id, Array.isArray(carro) ? carro : []);
		return clone(this.cache.carros.get(id));
	}

	async eliminarCarroItem(clienteId, index) {
		const id = String(clienteId ?? "").trim();
		const posicion = Number.parseInt(index ?? "", 10);
		if (!id || !Number.isFinite(posicion) || posicion < 0) {
			throw new Error("Parametros invalidos");
		}
		const carro = await this.proxy.eliminarItemCarro(id, posicion);
		this.cache.carros.set(id, Array.isArray(carro) ? carro : []);
		return clone(this.cache.carros.get(id));
	}

	async vaciarCarro(clienteId) {
		const id = String(clienteId ?? "").trim();
		if (!id) {
			throw new Error("Id de cliente invalido");
		}
		await this.proxy.vaciarCarro(id);
		this.cache.carros.set(id, []);
		return [];
	}

	async getAdmins({ force = false } = {}) {
		if (!this.flags.adminsLoaded || force) {
			this.cache.admins = await this.proxy.getAdmins();
			this.flags.adminsLoaded = true;
		}
		return clone(this.cache.admins);
	}

	async getAdminById(id, { force = false } = {}) {
		const stringId = String(id ?? "").trim();
		if (!stringId) {
			return null;
		}

		if (!force && this.flags.adminsLoaded) {
			const match = this.cache.admins.find((admin) => admin.id === stringId);
			if (match) {
				return clone(match);
			}
		}

		const admin = await this.proxy.getAdminPorId(stringId);
		this._upsertAdmin(admin);
		return clone(admin);
	}

	async crearAdmin(payload) {
		const admin = await this.proxy.agregarAdmin(payload);
		this._upsertAdmin(admin);
		return clone(admin);
	}

	async actualizarAdmin(id, payload) {
		const admin = await this.proxy.actualizarAdmin(id, payload);
		this._upsertAdmin(admin);
		return clone(admin);
	}

	async borrarAdmin(id) {
		await this.proxy.borrarAdmin(id);
		const stringId = String(id ?? "").trim();
		if (stringId) {
			this.cache.admins = this.cache.admins.filter(
				(admin) => admin.id !== stringId
			);
		}
		return true;
	}

	_upsertAdmin(admin) {
		if (!admin) {
			return;
		}
		const index = this.cache.admins.findIndex((entry) => entry.id === admin.id);
		if (index >= 0) {
			this.cache.admins.splice(index, 1, admin);
		} else {
			this.cache.admins.push(admin);
		}
	}

	async getFacturas({ force = false } = {}) {
		if (!this.flags.facturasLoaded || force) {
			this.cache.facturas = await this.proxy.getFacturas();
			this.flags.facturasLoaded = true;
		}
		return clone(this.cache.facturas);
	}

	async getFacturasPorCliente(clienteId, { force = false } = {}) {
		const id = String(clienteId ?? "").trim();
		if (!id) {
			return [];
		}
		const facturas = force
			? await this.proxy.getFacturas({ cliente: id })
			: (await this.getFacturas({ force })).filter(
					(factura) => factura.clienteId === id
			  );
		if (force) {
			const restantes = this.cache.facturas.filter(
				(factura) => factura.clienteId !== id
			);
			this.cache.facturas = [...restantes, ...facturas];
		}
		return clone(facturas);
	}

	async getFacturaById(id, { force = false } = {}) {
		const stringId = String(id ?? "").trim();
		if (!stringId) {
			return null;
		}

		if (!force && this.flags.facturasLoaded) {
			const match = this.cache.facturas.find(
				(factura) => factura.id === stringId
			);
			if (match) {
				return clone(match);
			}
		}

		const factura = await this.proxy.getFacturaPorId(stringId);
		this._upsertFactura(factura);
		return clone(factura);
	}

	async crearFactura(payload) {
		const factura = await this.proxy.facturar(payload);
		this._upsertFactura(factura);
		if (payload?.clienteId || payload?.usuarioId) {
			const clienteId = String(
				payload.clienteId ?? payload.usuarioId ?? ""
			).trim();
			if (clienteId) {
				this.cache.carros.delete(clienteId);
			}
		}
		this.flags.librosLoaded = false;
		return clone(factura);
	}

	_upsertFactura(factura) {
		if (!factura) {
			return;
		}
		const index = this.cache.facturas.findIndex(
			(entry) => entry.id === factura.id
		);
		if (index >= 0) {
			this.cache.facturas.splice(index, 1, factura);
		} else {
			this.cache.facturas.push(factura);
		}
	}

	reset() {
		this.cache.libros = [];
		this.cache.clientes = [];
		this.cache.admins = [];
		this.cache.facturas = [];
		this.cache.carros = new Map();
		this.flags.librosLoaded = false;
		this.flags.clientesLoaded = false;
		this.flags.adminsLoaded = false;
		this.flags.facturasLoaded = false;
	}
}

export const libreriaStore = new LibreriaStore();
