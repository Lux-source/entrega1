import { libroService } from "../services/libro-service.mjs";

const parsearIdNumerico = (valor) => {
	const id = Number.parseInt(valor ?? "", 10);
	return Number.isFinite(id) && id > 0 ? id : null;
};

export class LibroController {
	async obtenerLibros(req, res) {
		const { isbn, titulo, min, max } = req.query ?? {};

		if (isbn) {
			const libro = await libroService.obtenerPorIsbn(isbn);
			return libro
				? res.json(libro)
				: res.status(404).json({ error: "Libro no encontrado" });
		}

		if (titulo) {
			const libro = await libroService.obtenerPorTitulo(titulo);
			return libro
				? res.json(libro)
				: res.status(404).json({ error: "Libro no encontrado" });
		}

		let libros = await libroService.obtenerTodos();

		if (min !== undefined || max !== undefined) {
			const minPrice = min ? Number.parseFloat(min) : 0;
			const maxPrice = max ? Number.parseFloat(max) : Number.MAX_VALUE;
			libros = libros.filter(
				(l) => l.precio >= minPrice && l.precio <= maxPrice
			);
		}

		return res.json(libros);
	}

	async obtenerLibro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}

		const libro = await libroService.obtenerPorId(id);
		return libro
			? res.json(libro)
			: res.status(404).json({ error: "Libro no encontrado" });
	}

	async crearLibro(req, res) {
		try {
			const libro = await libroService.crear(req.body ?? {});
			return res.status(201).json(libro);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async actualizarLibro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}

		try {
			const libro = await libroService.actualizar(id, req.body ?? {});
			return libro
				? res.json(libro)
				: res.status(404).json({ error: "Libro no encontrado" });
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarLibro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}

		const eliminado = await libroService.eliminar(id);
		return eliminado
			? res.status(204).end()
			: res.status(404).json({ error: "Libro no encontrado" });
	}

	async reemplazarLibros(req, res) {
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ error: "Se espera un array de libros" });
		}
		try {
			const libros = await libroService.reemplazarTodos(req.body);
			return res.json(libros);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarLibros(req, res) {
		await libroService.eliminarTodos();
		return res.status(204).end();
	}
}

export const libroController = new LibroController();
