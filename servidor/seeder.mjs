import { Libro } from "./libro.mjs";
import { Usuario } from "./usuario.mjs";

class Model {
	constructor() {
		this.libros = [];
		this.usuarios = [];
		this.seed();
	}

	seed() {
		// Usuarios
		this.usuarios.push(
			new Usuario(
				1,
				"00000000A",
				"Admin",
				"Principal",
				"Calle Librería 1",
				"600000000",
				"admin@libreria.com",
				"Admin123",
				"ADMIN"
			),
			new Usuario(
				2,
				"11111111B",
				"Juan",
				"Pérez",
				"Calle Mayor 1",
				"600000001",
				"juan@mail.com",
				"Juanperez123",
				"CLIENTE"
			),
			new Usuario(
				3,
				"22222222C",
				"María",
				"García",
				"Av. Libertad 23",
				"600000002",
				"maria@mail.com",
				"Maria123",
				"CLIENTE"
			)
		);

		// Libros
		this.libros.push(
			new Libro(1, "Libro 1", "Lucian", "978-84-376-0494-7", 15.95, 25),
			new Libro(2, "Libro 2", "Loren", "978-84-204-2548-8", 18.9, 15),
			new Libro(3, "Libro 3", "Juanpi", "978-84-9759-252-5", 12.5, 30),
			new Libro(4, "Libro 4", "Héctor", "978-84-9841-483-8", 9.95, 50)
		);
	}
}

export const model = new Model();
