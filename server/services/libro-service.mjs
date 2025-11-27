import { db } from "../data/db-context.mjs";
import { Libro } from "../models/index.mjs";
import mongoose from "mongoose";

export class LibroService {
	async obtenerTodos() {
		return await db.obtenerTodos("libros");
	}

	async obtenerPorId(id) {
		return await db.obtener("libros", id);
	}

	async obtenerPorIsbn(isbn) {
		if (!isbn) return null;
		const libro = await Libro.buscarPorIsbn(isbn.toString().trim());
		return libro ? libro.toJSON() : null;
	}

	async obtenerPorTitulo(titulo) {
		if (!titulo) return null;
		const libros = await Libro.buscarPorTitulo(titulo.toString().trim());
		return libros.length > 0 ? libros[0].toJSON() : null;
	}

	async crear(datos) {
		try {
			const libro = {
				titulo: datos.titulo,
				autor: datos.autor,
				isbn: datos.isbn,
				precio: Number.parseFloat(datos.precio ?? 0),
				stock: Number.parseInt(datos.stock ?? 0, 10),
			};
			return await db.agregar("libros", libro);
		} catch (error) {
			// Manejar error de ISBN duplicado
			if (error.code === 11000 && error.keyPattern?.isbn) {
				throw new Error("El ISBN ya existe");
			}
			throw error;
		}
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

		try {
			return await db.actualizar("libros", id, actualizaciones);
		} catch (error) {
			// Manejar error de ISBN duplicado
			if (error.code === 11000 && error.keyPattern?.isbn) {
				throw new Error("El ISBN ya existe");
			}
			throw error;
		}
	}

	async eliminar(id) {
		return await db.eliminar("libros", id);
	}

	async reemplazarTodos(datosLibros) {
		// Reiniciar la colección primero
		await db.guardarTodos("libros", []);

		// Añadir nuevos libros
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
