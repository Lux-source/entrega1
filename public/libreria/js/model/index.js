import { Libro } from "./libro.js";
import { Usuario } from "./usuario.js";

class Model {
	constructor() {
		this.libros = [];
		this.usuarios = [];
		this.seed();
	}

	seed() {
		// Usuarios de prueba
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

		// Libros de prueba
		this.libros.push(
			new Libro(
				1,
				"Don Quijote de la Mancha",
				"Miguel de Cervantes",
				"978-84-376-0494-7",
				15.95,
				25,
				"https://placehold.co/200x300/2c3e50/white?text=Don+Quijote",
				"Obra cumbre de la literatura española"
			),
			new Libro(
				2,
				"Cien años de soledad",
				"Gabriel García Márquez",
				"978-84-204-2548-8",
				18.9,
				15,
				"https://placehold.co/200x300/3498db/white?text=Cien+Años",
				"Realismo mágico latinoamericano"
			),
			new Libro(
				3,
				"1984",
				"George Orwell",
				"978-84-9759-252-5",
				12.5,
				30,
				"https://placehold.co/200x300/e74c3c/white?text=1984",
				"Distopía totalitaria"
			),
			new Libro(
				4,
				"El principito",
				"Antoine de Saint-Exupéry",
				"978-84-9841-483-8",
				9.95,
				50,
				"https://placehold.co/200x300/f39c12/white?text=Principito",
				"Cuento filosófico"
			),
			new Libro(
				5,
				"Harry Potter y la piedra filosofal",
				"J.K. Rowling",
				"978-84-9838-936-6",
				16.95,
				20,
				"https://placehold.co/200x300/9b59b6/white?text=Harry+Potter",
				"Fantasía juvenil"
			),
			new Libro(
				6,
				"El código Da Vinci",
				"Dan Brown",
				"978-84-08-17263-1",
				14.9,
				10,
				"https://placehold.co/200x300/16a085/white?text=Da+Vinci",
				"Thriller conspirativo"
			)
		);
	}
}

export const model = new Model();
