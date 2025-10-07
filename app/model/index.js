import { Libro } from './libro.js';
import { Usuario } from './usuario.js';

class Model {
    constructor() {
        this.libros = [];
        this.usuarios = [];
        this.seed();
    }

    seed() {
        // Usuarios de prueba
        this.usuarios.push(
            new Usuario(1, 'Admin Principal', 'admin@libreria.com', 'admin123', 'admin'),
            new Usuario(2, 'Juan Pérez', 'juan@mail.com', '123456', 'cliente', 'Calle Mayor 1'),
            new Usuario(3, 'María García', 'maria@mail.com', '123456', 'cliente', 'Av. Libertad 23')
        );

        // Libros de prueba
        this.libros.push(
            new Libro(1, 'Don Quijote de la Mancha', 'Miguel de Cervantes', '978-84-376-0494-7', 15.95, 25, 'https://via.placeholder.com/200x300?text=Don+Quijote', 'Obra cumbre de la literatura española'),
            new Libro(2, 'Cien años de soledad', 'Gabriel García Márquez', '978-84-204-2548-8', 18.90, 15, 'https://via.placeholder.com/200x300?text=Cien+Años', 'Realismo mágico latinoamericano'),
            new Libro(3, '1984', 'George Orwell', '978-84-9759-252-5', 12.50, 30, 'https://via.placeholder.com/200x300?text=1984', 'Distopía totalitaria'),
            new Libro(4, 'El principito', 'Antoine de Saint-Exupéry', '978-84-9841-483-8', 9.95, 50, 'https://via.placeholder.com/200x300?text=Principito', 'Cuento filosófico'),
            new Libro(5, 'Harry Potter y la piedra filosofal', 'J.K. Rowling', '978-84-9838-936-6', 16.95, 20, 'https://via.placeholder.com/200x300?text=Harry+Potter', 'Fantasía juvenil'),
            new Libro(6, 'El código Da Vinci', 'Dan Brown', '978-84-08-17263-1', 14.90, 10, 'https://via.placeholder.com/200x300?text=Da+Vinci', 'Thriller conspirativo')
        );
    }
}

export const model = new Model();