import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database.json");

const ROL = {
	ADMIN: "ADMIN",
	CLIENTE: "CLIENTE",
};

class DbContexto {
	constructor() {
		this.datos = {
			libros: [],
			clientes: [],
			admins: [],
			facturas: [],
			carros: {}, // Map no es serializable en JSON, usamos objeto
			_contadores: {
				libros: 1,
				clientes: 1,
				admins: 1,
				facturas: 1,
			},
		};
		this.cargado = false;
	}

	async iniciar() {
		try {
			const contenido = await fs.readFile(DB_PATH, "utf-8");
			this.datos = JSON.parse(contenido);

			// Validación y reparación de estructura
			if (!this.datos._contadores) {
				this.datos._contadores = {
					libros: 1,
					clientes: 1,
					admins: 1,
					facturas: 1,
				};
			}
			if (!this.datos.libros) this.datos.libros = [];
			if (!this.datos.clientes) this.datos.clientes = [];
			if (!this.datos.admins) this.datos.admins = [];
			if (!this.datos.facturas) this.datos.facturas = [];
			if (!this.datos.carros) this.datos.carros = {};

			this.cargado = true;
		} catch (error) {
			if (error.code === "ENOENT") {
				await this.semilla();
			} else {
				throw error;
			}
		}
	}

	async guardar() {
		await fs.writeFile(DB_PATH, JSON.stringify(this.datos, null, 2));
	}

	async semilla() {
		this.datos = {
			libros: [],
			clientes: [],
			admins: [],
			facturas: [],
			carros: {},
			_contadores: {
				libros: 1,
				clientes: 1,
				admins: 1,
				facturas: 1,
			},
		};

		// Semilla Admins
		this.datos.admins.push({
			id: this._siguienteId("admins"),
			dni: "00000000A",
			nombre: "Admin",
			apellidos: "Principal",
			direccion: "Calle Libreria 1",
			telefono: "600000000",
			email: "admin@libreria.com",
			password: "Admin123",
			rol: ROL.ADMIN,
		});

		// Semilla Clientes
		this.datos.clientes.push(
			{
				id: this._siguienteId("clientes"),
				dni: "11111111B",
				nombre: "Juan",
				apellidos: "Perez",
				direccion: "Calle Mayor 1",
				telefono: "600000001",
				email: "juan@mail.com",
				password: "Juanperez123",
				rol: ROL.CLIENTE,
			},
			{
				id: this._siguienteId("clientes"),
				dni: "22222222C",
				nombre: "Maria",
				apellidos: "Garcia",
				direccion: "Av. Libertad 23",
				telefono: "600000002",
				email: "maria@mail.com",
				password: "Maria123",
				rol: ROL.CLIENTE,
			}
		);

		// Semilla Libros
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

		librosSeed.forEach((l) => {
			this.datos.libros.push({
				id: this._siguienteId("libros"),
				...l,
			});
		});

		// Semilla Facturas
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

		comprasSeed.forEach((compra) => {
			// Actualizar stock
			compra.items.forEach((item) => {
				const libro = this.datos.libros.find((l) => l.id === item.libroId);
				if (libro) {
					libro.stock -= item.cantidad;
				}
			});

			// Calcular total
			const total = compra.items.reduce((sum, item) => {
				const libro = this.datos.libros.find((l) => l.id === item.libroId);
				return sum + (libro ? libro.precio * item.cantidad : 0);
			}, 0);

			this.datos.facturas.push({
				id: this._siguienteId("facturas"),
				numero: this._generarNumeroFactura(),
				fecha: new Date().toISOString(),
				clienteId: compra.clienteId,
				items: compra.items,
				total: total,
				envio: compra.envio,
			});
		});

		await this.guardar();
		this.cargado = true;
	}

	_siguienteId(clave) {
		const valor = this.datos._contadores[clave] ?? 1;
		this.datos._contadores[clave] = valor + 1;
		return valor;
	}

	_generarNumeroFactura() {
		const numero = String(this.datos._contadores.facturas).padStart(4, "0");
		return `FAC-${numero}`;
	}

	async obtenerTodos(coleccion) {
		if (!this.cargado) await this.iniciar();
		return this.datos[coleccion];
	}

	async guardarTodos(coleccion, datos) {
		if (!this.cargado) await this.iniciar();
		this.datos[coleccion] = datos;
		await this.guardar();
	}

	async obtener(coleccion, id) {
		if (!this.cargado) await this.iniciar();
		return this.datos[coleccion].find((item) => item.id === id);
	}

	async agregar(coleccion, item) {
		if (!this.cargado) await this.iniciar();
		item.id = this._siguienteId(coleccion);
		this.datos[coleccion].push(item);
		await this.guardar();
		return item;
	}

	async actualizar(coleccion, id, actualizaciones) {
		if (!this.cargado) await this.iniciar();
		const indice = this.datos[coleccion].findIndex((item) => item.id === id);
		if (indice === -1) return null;

		this.datos[coleccion][indice] = {
			...this.datos[coleccion][indice],
			...actualizaciones,
		};
		await this.guardar();
		return this.datos[coleccion][indice];
	}

	async eliminar(coleccion, id) {
		if (!this.cargado) await this.iniciar();
		const longitudInicial = this.datos[coleccion].length;
		this.datos[coleccion] = this.datos[coleccion].filter(
			(item) => item.id !== id
		);
		if (this.datos[coleccion].length < longitudInicial) {
			await this.guardar();
			return true;
		}
		return false;
	}

	// Específico para carros ya que son un mapa/objeto
	async obtenerCarro(clienteId) {
		if (!this.cargado) await this.iniciar();
		return this.datos.carros[clienteId] || [];
	}

	async guardarCarro(clienteId, carro) {
		if (!this.cargado) await this.iniciar();
		this.datos.carros[clienteId] = carro;
		await this.guardar();
	}

	async eliminarCarro(clienteId) {
		if (!this.cargado) await this.iniciar();
		delete this.datos.carros[clienteId];
		await this.guardar();
	}

	async reiniciar() {
		await this.semilla();
	}
}

export const db = new DbContexto();
