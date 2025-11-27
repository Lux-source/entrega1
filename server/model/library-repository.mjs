import { Libro } from "../domain/libro.mjs";
import { Usuario } from "../domain/usuario.mjs";

const ROL = {
	ADMIN: "ADMIN",
	CLIENTE: "CLIENTE",
};

class Factura {
	constructor({
		id = null,
		numero = null,
		fecha = new Date().toISOString(),
		clienteId = null,
		items = [],
		total = 0,
		envio = {},
	}) {
		this.id = id;
		this.numero = numero;
		this.fecha = fecha;
		this.clienteId = clienteId;
		this.items = Array.isArray(items) ? items.map(Factura.normalizarItem) : [];
		this.total = Number.isFinite(total) ? total : 0;
		this.envio = { ...envio };
	}

	static normalizarItem(item) {
		if (!item) {
			return null;
		}

		const libroId = Number.parseInt(item.libroId ?? item.id ?? 0, 10);
		const cantidad = Number.parseInt(item.cantidad ?? 0, 10);

		if (
			!Number.isFinite(libroId) ||
			!Number.isFinite(cantidad) ||
			cantidad <= 0
		) {
			return null;
		}

		return {
			libroId,
			cantidad,
		};
	}
}

class LibraryRepository {
	constructor() {
		this.reset();
		this.seed();
	}

	reset() {
		this.libros = [];
		this.clientes = [];
		this.admins = [];
		this.facturas = [];
		this.carros = new Map();
		this._counters = {
			libros: 1,
			clientes: 1,
			admins: 1,
			facturas: 1,
		};
	}

	seed() {
		this._seedUsuarios();
		this._seedLibros();
		this._seedFacturas();
	}

	_seedUsuarios() {
		const admin = new Usuario(
			this._nextId("admins"),
			"00000000A",
			"Admin",
			"Principal",
			"Calle Libreria 1",
			"600000000",
			"admin@libreria.com",
			"Admin123",
			ROL.ADMIN
		);
		this.admins.push(admin);

		const cliente1 = new Usuario(
			this._nextId("clientes"),
			"11111111B",
			"Juan",
			"Perez",
			"Calle Mayor 1",
			"600000001",
			"juan@mail.com",
			"Juanperez123",
			ROL.CLIENTE
		);
		const cliente2 = new Usuario(
			this._nextId("clientes"),
			"22222222C",
			"Maria",
			"Garcia",
			"Av. Libertad 23",
			"600000002",
			"maria@mail.com",
			"Maria123",
			ROL.CLIENTE
		);
		this.clientes.push(cliente1, cliente2);
	}

	_seedLibros() {
		const librosSeed = [
			{
				titulo: "Libro 1",
				autor: "Lucian",
				isbn: "978-84-376-0494-7",
				precio: 15.95,
				stock: 25,
			},
			{
				titulo: "Libro 2",
				autor: "Loren",
				isbn: "978-84-204-2548-8",
				precio: 18.9,
				stock: 15,
			},
			{
				titulo: "Libro 3",
				autor: "Juanpi",
				isbn: "978-84-9759-252-5",
				precio: 12.5,
				stock: 30,
			},
			{
				titulo: "Libro 4",
				autor: "Hector",
				isbn: "978-84-9841-483-8",
				precio: 9.95,
				stock: 50,
			},
		];

		librosSeed.forEach((data) => {
			const libro = new Libro(
				this._nextId("libros"),
				data.titulo,
				data.autor,
				data.isbn,
				data.precio,
				data.stock
			);
			this.libros.push(libro);
		});
	}

	_seedFacturas() {
		const comprasSeed = [
			{
				clienteId: 1,
				items: [
					{ libroId: 1, cantidad: 1 },
					{ libroId: 3, cantidad: 2 },
				],
				envio: {
					nombre: "Juan Perez",
					direccion: "Calle Mayor 1",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000001",
				},
			},
			{
				clienteId: 2,
				items: [
					{ libroId: 2, cantidad: 1 },
					{ libroId: 4, cantidad: 3 },
				],
				envio: {
					nombre: "Maria Garcia",
					direccion: "Av. Libertad 23",
					ciudad: "Valencia",
					cp: "46001",
					telefono: "600000002",
				},
			},
		];

		comprasSeed.forEach((seed) => {
			this.facturarCompraCliente(seed, { generarNumero: false });
		});
	}

	_nextId(key) {
		const value = this._counters[key] ?? 1;
		this._counters[key] = value + 1;
		return value;
	}

	_generateNumeroFactura() {
		const numero = String(this._counters.facturas).padStart(4, "0");
		return `FAC-${numero}`;
	}

	_calcularTotal(items = []) {
		return items.reduce((sum, item) => {
			const libro = this.getLibroPorId(item.libroId);
			if (!libro) {
				return sum;
			}
			return sum + libro.precio * item.cantidad;
		}, 0);
	}
	getLibros() {
		return this.libros;
	}

	setLibros(libros = []) {
		this.libros = [];
		this._counters.libros = 1;
		libros.forEach((libroData) => {
			this.addLibro(libroData);
		});
		return this.getLibros();
	}

	removeLibros() {
		this.libros = [];
		this._counters.libros = 1;
		return [];
	}

	addLibro(data) {
		const libro = new Libro(
			this._nextId("libros"),
			data.titulo,
			data.autor,
			data.isbn,
			Number.parseFloat(data.precio ?? 0),
			Number.parseInt(data.stock ?? 0, 10)
		);
		this.libros.push(libro);
		return libro;
	}

	getLibroPorId(id) {
		const libroId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(libroId)) {
			return null;
		}
		return this.libros.find((libro) => libro.id === libroId) ?? null;
	}

	getLibroPorIsbn(isbn) {
		if (!isbn) {
			return null;
		}
		const normalizado = isbn.toString().trim().toLowerCase();
		return (
			this.libros.find(
				(libro) => libro.isbn?.toString().trim().toLowerCase() === normalizado
			) ?? null
		);
	}

	getLibroPorTitulo(titulo) {
		if (!titulo) {
			return null;
		}
		const normalizado = titulo.toString().trim().toLowerCase();
		return (
			this.libros.find(
				(libro) => libro.titulo?.toString().trim().toLowerCase() === normalizado
			) ?? null
		);
	}

	removeLibro(id) {
		const libroId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(libroId)) {
			return false;
		}
		const previousLength = this.libros.length;
		this.libros = this.libros.filter((libro) => libro.id !== libroId);
		return this.libros.length < previousLength;
	}

	updateLibro(id, data) {
		const libro = this.getLibroPorId(id);
		if (!libro) {
			return null;
		}

		if (data.titulo !== undefined) {
			libro.titulo = data.titulo;
		}
		if (data.autor !== undefined) {
			libro.autor = data.autor;
		}
		if (data.isbn !== undefined) {
			libro.isbn = data.isbn;
		}
		if (data.precio !== undefined) {
			libro.setPrecio(Number.parseFloat(data.precio));
		}
		if (data.stock !== undefined) {
			libro.setStock(Number.parseInt(data.stock, 10));
		}

		return libro;
	}
	getClientes() {
		return this.clientes;
	}

	setClientes(clientes = []) {
		this.clientes = [];
		this._counters.clientes = 1;
		clientes.forEach((cliente) => {
			this.addCliente(cliente);
		});
		return this.getClientes();
	}

	removeClientes() {
		this.clientes = [];
		this._counters.clientes = 1;
		this.carros.clear();
		return [];
	}

	addCliente(data) {
		this._validarUnicidadCliente(data);
		const cliente = new Usuario(
			this._nextId("clientes"),
			data.dni,
			data.nombre,
			data.apellidos,
			data.direccion,
			data.telefono,
			data.email,
			data.password,
			ROL.CLIENTE
		);
		this.clientes.push(cliente);
		return cliente;
	}

	_validarUnicidadCliente(data) {
		const email = data.email?.toString().trim().toLowerCase();
		const dni = data.dni?.toString().trim().toUpperCase();

		if (email && this.getClientePorEmail(email)) {
			throw new Error("Email de cliente ya registrado");
		}
		if (dni && this.getClientePorDni(dni)) {
			throw new Error("DNI de cliente ya registrado");
		}
	}

	getClientePorId(id) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			return null;
		}
		return this.clientes.find((cliente) => cliente.id === clienteId) ?? null;
	}

	getClientePorEmail(email) {
		if (!email) {
			return null;
		}
		const normalizado = email.toString().trim().toLowerCase();
		return (
			this.clientes.find(
				(cliente) =>
					cliente.email?.toString().trim().toLowerCase() === normalizado
			) ?? null
		);
	}

	getClientePorDni(dni) {
		if (!dni) {
			return null;
		}
		const normalizado = dni.toString().trim().toUpperCase();
		return (
			this.clientes.find(
				(cliente) =>
					cliente.dni?.toString().trim().toUpperCase() === normalizado
			) ?? null
		);
	}

	removeCliente(id) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			return false;
		}
		const previousLength = this.clientes.length;
		this.clientes = this.clientes.filter((cliente) => cliente.id !== clienteId);
		this.carros.delete(clienteId);
		return this.clientes.length < previousLength;
	}

	updateCliente(id, data) {
		const cliente = this.getClientePorId(id);
		if (!cliente) {
			return null;
		}

		if (data.email && data.email !== cliente.email) {
			const emailExistente = this.getClientePorEmail(data.email);
			if (emailExistente && emailExistente.id !== cliente.id) {
				throw new Error("Email de cliente ya registrado");
			}
		}

		if (data.dni && data.dni !== cliente.dni) {
			const dniExistente = this.getClientePorDni(data.dni);
			if (dniExistente && dniExistente.id !== cliente.id) {
				throw new Error("DNI de cliente ya registrado");
			}
		}

		Object.assign(cliente, data);
		return cliente;
	}

	autenticarCliente({ email, password }) {
		const cliente = this.getClientePorEmail(email);
		if (!cliente || cliente.password !== password) {
			throw new Error("Credenciales de cliente invalidas");
		}
		return cliente;
	}

	getCarroCliente(id) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			throw new Error("Id de cliente invalido");
		}
		return this.carros.get(clienteId) ?? [];
	}

	addClienteCarroItem(id, item) {
		const cliente = this.getClientePorId(id);
		if (!cliente) {
			throw new Error("Cliente no encontrado");
		}

		const libro = this.getLibroPorId(item.libroId);
		if (!libro) {
			throw new Error("Libro no encontrado");
		}

		const cantidad = Number.parseInt(item.cantidad ?? 1, 10);
		if (!Number.isFinite(cantidad) || cantidad <= 0) {
			throw new Error("Cantidad invalida");
		}

		const carroActual = [...(this.carros.get(cliente.id) ?? [])];
		const existente = carroActual.find((entry) => entry.libroId === libro.id);
		const cantidadActual = existente?.cantidad ?? 0;
		const nuevaCantidad = cantidadActual + cantidad;
		const stockDisponible = Number.isFinite(libro.stock) ? libro.stock : 0;
		if (nuevaCantidad > stockDisponible) {
			throw new Error("No hay suficiente stock disponible para el libro");
		}
		if (existente) {
			existente.cantidad = nuevaCantidad;
		} else {
			carroActual.push({ libroId: libro.id, cantidad });
		}

		this.carros.set(cliente.id, carroActual);
		return carroActual;
	}

	setClienteCarroItemCantidad(id, index, cantidad) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			throw new Error("Id de cliente invalido");
		}

		const carroActual = [...(this.carros.get(clienteId) ?? [])];
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
		const libro = this.getLibroPorId(item.libroId);
		if (!libro) {
			throw new Error("Libro no encontrado");
		}
		const stockDisponible = Number.isFinite(libro.stock) ? libro.stock : 0;
		if (nuevaCantidad > stockDisponible) {
			throw new Error("No hay suficiente stock disponible para el libro");
		}
		carroActual[posicion].cantidad = nuevaCantidad;
		this.carros.set(clienteId, carroActual);
		return carroActual;
	}

	removeClienteCarroItem(id, index) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			throw new Error("Id de cliente invalido");
		}

		const carroActual = [...(this.carros.get(clienteId) ?? [])];
		const posicion = Number.parseInt(index ?? -1, 10);
		if (
			!Number.isFinite(posicion) ||
			posicion < 0 ||
			posicion >= carroActual.length
		) {
			throw new Error("Indice de item invalido");
		}

		carroActual.splice(posicion, 1);
		this.carros.set(clienteId, carroActual);
		return carroActual;
	}

	clearClienteCarro(id) {
		const clienteId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(clienteId)) {
			throw new Error("Id de cliente invalido");
		}
		this.carros.delete(clienteId);
		return [];
	}
	getAdmins() {
		return this.admins;
	}

	setAdmins(admins = []) {
		this.admins = [];
		this._counters.admins = 1;
		admins.forEach((admin) => {
			this.addAdmin(admin);
		});
		return this.getAdmins();
	}

	removeAdmins() {
		this.admins = [];
		this._counters.admins = 1;
		return [];
	}

	addAdmin(data) {
		const admin = new Usuario(
			this._nextId("admins"),
			data.dni,
			data.nombre,
			data.apellidos,
			data.direccion,
			data.telefono,
			data.email,
			data.password,
			ROL.ADMIN
		);
		this.admins.push(admin);
		return admin;
	}

	getAdminPorId(id) {
		const adminId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(adminId)) {
			return null;
		}
		return this.admins.find((admin) => admin.id === adminId) ?? null;
	}

	getAdminPorEmail(email) {
		if (!email) {
			return null;
		}
		const normalizado = email.toString().trim().toLowerCase();
		return (
			this.admins.find(
				(admin) => admin.email?.toString().trim().toLowerCase() === normalizado
			) ?? null
		);
	}

	getAdminPorDni(dni) {
		if (!dni) {
			return null;
		}
		const normalizado = dni.toString().trim().toUpperCase();
		return (
			this.admins.find(
				(admin) => admin.dni?.toString().trim().toUpperCase() === normalizado
			) ?? null
		);
	}

	removeAdmin(id) {
		const adminId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(adminId)) {
			return false;
		}
		const previousLength = this.admins.length;
		this.admins = this.admins.filter((admin) => admin.id !== adminId);
		return this.admins.length < previousLength;
	}

	updateAdmin(id, data) {
		const admin = this.getAdminPorId(id);
		if (!admin) {
			return null;
		}

		Object.assign(admin, data);
		return admin;
	}

	autenticarAdmin({ email, password }) {
		const admin = this.getAdminPorEmail(email);
		if (!admin || admin.password !== password) {
			throw new Error("Credenciales de administrador invalidas");
		}
		return admin;
	}
	getFacturas() {
		return this.facturas;
	}

	setFacturas(facturas = []) {
		this.facturas = [];
		this._counters.facturas = 1;
		facturas.forEach((factura) => {
			this.facturarCompraCliente(factura, { generarNumero: false });
		});
		return this.getFacturas();
	}

	removeFacturas() {
		this.facturas = [];
		this._counters.facturas = 1;
		return [];
	}

	facturarCompraCliente(data, { generarNumero = true } = {}) {
		const itemsNormalizados = (data.items ?? [])
			.map(Factura.normalizarItem)
			.filter(Boolean);
		const total = data.total ?? this._calcularTotal(itemsNormalizados);
		itemsNormalizados.forEach((item) => {
			const libro = this.getLibroPorId(item.libroId);
			if (!libro) {
				throw new Error("Libro no encontrado para la compra");
			}
			const stockDisponible = Number.isFinite(libro.stock) ? libro.stock : 0;
			if (item.cantidad > stockDisponible) {
				throw new Error(`Stock insuficiente para el libro con id ${libro.id}`);
			}
		});

		itemsNormalizados.forEach((item) => {
			const libro = this.getLibroPorId(item.libroId);
			libro.setStock((libro.stock ?? 0) - item.cantidad);
		});

		const factura = new Factura({
			id: this._nextId("facturas"),
			numero: generarNumero ? this._generateNumeroFactura() : data.numero,
			fecha: data.fecha ?? new Date().toISOString(),
			clienteId: data.clienteId ?? null,
			items: itemsNormalizados,
			total,
			envio: data.envio ?? {},
		});
		this.facturas.push(factura);

		if (factura.clienteId) {
			this.clearClienteCarro(factura.clienteId);
		}
		return factura;
	}

	getFacturaPorId(id) {
		const facturaId = Number.parseInt(id ?? 0, 10);
		if (!Number.isFinite(facturaId)) {
			return null;
		}
		return this.facturas.find((factura) => factura.id === facturaId) ?? null;
	}

	getFacturaPorNumero(numero) {
		if (!numero) {
			return null;
		}
		const normalizado = numero.toString().trim().toUpperCase();
		return (
			this.facturas.find(
				(factura) =>
					factura.numero?.toString().trim().toUpperCase() === normalizado
			) ?? null
		);
	}

	getFacturasPorCliente(clienteId) {
		const id = Number.parseInt(clienteId ?? 0, 10);
		if (!Number.isFinite(id)) {
			return [];
		}
		return this.facturas.filter((factura) => factura.clienteId === id);
	}
}

export const libraryRepository = new LibraryRepository();
