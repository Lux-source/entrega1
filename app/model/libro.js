export class Libro {
    constructor(id, titulo, autor, isbn, precio, stock, portada, descripcion = '', editorial = '', anio = null, paginas = null, idioma = 'Español') {
        this.id = id;
        this.titulo = titulo;
        this.autor = autor;
        this.isbn = isbn;
        this.precio = precio;
        this.stock = stock;
        this.portada = portada;
        this.descripcion = descripcion;
        this.editorial = editorial;
        this.anio = anio;
        this.paginas = paginas;
        this.idioma = idioma;
    }

    // Getters
    getId() { return this.id; }
    getTitulo() { return this.titulo; }
    getPrecio() { return this.precio; }
    getStock() { return this.stock; }

    // Setters con validación
    setStock(stock) {
        if (stock < 0) throw new Error('El stock no puede ser negativo');
        this.stock = stock;
    }

    setPrecio(precio) {
        if (precio <= 0) throw new Error('El precio debe ser mayor que 0');
        this.precio = precio;
    }

    reducirStock(cantidad) {
        if (cantidad > this.stock) {
            throw new Error('Stock insuficiente');
        }
        this.stock -= cantidad;
    }
}