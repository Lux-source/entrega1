import { Libro } from "./libro.mjs";
import { Usuario } from "./usuario.mjs";
import { Compra } from "./compra.mjs";

class Model {
	constructor() {
		this.libros = [];
		this.usuarios = [];
		this.compras = [];
		this._nextCompraId = 1;
		this.seed();
	}

	seed() {
		this.seedUsuarios();
		this.seedLibros();
		this.seedCompras();
		this.actualizarSiguienteCompraId();
	}

	seedUsuarios() {
		this.usuarios.push(
			new Usuario(
				1,
				"00000000A",
				"Admin",
				"Principal",
				"Calle Libreria 1",
				"600000000",
				"admin@libreria.com",
				"Admin123",
				"ADMIN"
			),
			new Usuario(
				2,
				"11111111B",
				"Juan",
				"Perez",
				"Calle Mayor 1",
				"600000001",
				"juan@mail.com",
				"Juanperez123",
				"CLIENTE"
			),
			new Usuario(
				3,
				"22222222C",
				"Maria",
				"Garcia",
				"Av. Libertad 23",
				"600000002",
				"maria@mail.com",
				"Maria123",
				"CLIENTE"
			)
		);
	}

	seedLibros() {
		this.libros.push(
			new Libro(1, "Libro 1", "Lucian", "978-84-376-0494-7", 15.95, 25),
			new Libro(2, "Libro 2", "Loren", "978-84-204-2548-8", 18.9, 15),
			new Libro(3, "Libro 3", "Juanpi", "978-84-9759-252-5", 12.5, 30),
			new Libro(4, "Libro 4", "Hector", "978-84-9841-483-8", 9.95, 50)
		);
	}

	seedCompras() {
		if (!this.libros.length || !this.usuarios.length) {
			return;
		}

		const comprasSeed = [
			{
				id: 1,
				fecha: "2025-10-01T09:00:00.000Z",
				usuarioId: 2,
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
				id: 2,
				fecha: "2025-10-10T17:30:00.000Z",
				usuarioId: 3,
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

		for (const compraSeed of comprasSeed) {
			const total = compraSeed.items.reduce((sum, item) => {
				const libro = this.libros.find((lib) => lib.id === item.libroId);
				if (!libro) {
					return sum;
				}
				return sum + libro.precio * item.cantidad;
			}, 0);

			this.compras.push(new Compra({ ...compraSeed, total }));
		}
	}

	actualizarSiguienteCompraId() {
		const maxId = this.compras.reduce(
			(max, compra) => Math.max(max, compra.id ?? 0),
			0
		);
		this._nextCompraId = Math.max(maxId + 1, this._nextCompraId);

		// Log de depuración
		console.log(`[Model] Seeder completado:`);
		console.log(`  - Usuarios: ${this.usuarios.length}`);
		console.log(`  - Libros: ${this.libros.length}`);
		console.log(`  - Compras: ${this.compras.length}`);
		console.log(`  - Próximo ID de compra: ${this._nextCompraId}`);
		console.log(`  - Compras cargadas:`, this.compras);
	}

	// Metodos para gestionar compras
	addCompra(obj) {
		const compra = new Compra(obj);
		compra.id = this._nextCompraId++;
		this.compras.push(compra);
		return compra;
	}

	getCompras() {
		return this.compras;
	}

	getCompra(id) {
		return this.compras.find((compra) => compra.id === id);
	}

	getComprasPorUsuario(usuarioId) {
		return this.compras.filter((compra) => compra.usuarioId === usuarioId);
	}
}

export const model = new Model();
