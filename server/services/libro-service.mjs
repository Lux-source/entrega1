import { db } from "../data/db-context.mjs";

export class LibroService {
	async obtenerTodos() {
		return await db.obtenerTodos("libros");
	}

	async obtenerPorId(id) {
		return await db.obtener("libros", id);
	}

	async obtenerPorIsbn(isbn) {
		const libros = await db.obtenerTodos("libros");
		const normalizado = isbn.toString().trim().toLowerCase();
		return (
			libros.find(
				(l) => l.isbn?.toString().trim().toLowerCase() === normalizado
			) || null
		);
	}

	async obtenerPorTitulo(titulo) {
		const libros = await db.obtenerTodos("libros");
		const normalizado = titulo.toString().trim().toLowerCase();
		return (
			libros.find(
				(l) => l.titulo?.toString().trim().toLowerCase() === normalizado
			) || null
		);
	}

	async crear(datos) {
		const libro = {
			titulo: datos.titulo,
			autor: datos.autor,
			isbn: datos.isbn,
			precio: Number.parseFloat(datos.precio ?? 0),
			stock: Number.parseInt(datos.stock ?? 0, 10),
		};
		return await db.agregar("libros", libro);
	}

	async actualizar(id, datos) {
		const libro = await this.obtenerPorId(id);
		if (!libro) return null;

		const actualizaciones = {};
		if (datos.titulo !== undefined) actualizaciones.titulo = datos.titulo;
		if (datos.autor !== undefined) actualizaciones.autor = datos.autor;
		if (datos.isbn !== undefined) actualizaciones.isbn = datos.isbn;
		if (datos.precio !== undefined)
			actualizaciones.precio = Number.parseFloat(datos.precio);
		if (datos.stock !== undefined)
			actualizaciones.stock = Number.parseInt(datos.stock, 10);

		return await db.actualizar("libros", id, actualizaciones);
	}

	async eliminar(id) {
		return await db.eliminar("libros", id);
	}

	async reemplazarTodos(datosLibros) {
		// Reiniciar la colección primero
		await db.guardarTodos("libros", []);

		// Asumimos que limpiamos y añadimos nuevos.
		for (const datos of datosLibros) {
			await this.crear(datos);
		}
		return await this.obtenerTodos();
	}

	async eliminarTodos() {
		await db.guardarTodos("libros", []);
		return [];
	}
}

export const libroService = new LibroService();
