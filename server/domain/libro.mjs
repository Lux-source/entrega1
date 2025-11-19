export class Libro {
	constructor(id, titulo, autor, isbn, precio, stock) {
		this.id = id;
		this.titulo = titulo;
		this.autor = autor;
		this.isbn = isbn;
		this.precio = precio;
		this.stock = stock;
	}

	getId() {
		return this.id;
	}

	setStock(stock) {
		if (!Number.isFinite(stock) || stock < 0) {
			throw new Error("El stock no puede ser negativo");
		}
		this.stock = stock;
	}

	setPrecio(precio) {
		if (!Number.isFinite(precio) || precio <= 0) {
			throw new Error("El precio debe ser mayor que 0");
		}
		this.precio = precio;
	}

	reducirStock(cantidad) {
		const nuevaCantidad = Number.parseInt(cantidad ?? 0, 10);
		if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
			throw new Error("Cantidad invalida");
		}
		if (nuevaCantidad > (this.stock ?? 0)) {
			throw new Error("Stock insuficiente");
		}
		this.stock -= nuevaCantidad;
	}
}
