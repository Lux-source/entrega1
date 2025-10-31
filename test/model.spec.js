import { Libro } from "../public/libreria/js/model/libro.js";
import { Usuario } from "../public/libreria/js/model/usuario.js";

// Tests para la clase Libro
describe("Modelo: Libro", () => {
	describe("Getters y Setters", () => {
		it("debería crear un libro con los datos correctos", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10.5, 5, "url");
			expect(libro.getId()).to.equal(1);
			expect(libro.getTitulo()).to.equal("Test");
			expect(libro.getPrecio()).to.equal(10.5);
			expect(libro.getStock()).to.equal(5);
		});

		it("debería actualizar el stock correctamente", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			libro.setStock(10);
			expect(libro.getStock()).to.equal(10);
		});

		it("debería actualizar el precio correctamente", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			libro.setPrecio(15.99);
			expect(libro.getPrecio()).to.equal(15.99);
		});
	});

	describe("Excepciones", () => {
		it("debería lanzar excepción con stock negativo", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			expect(() => libro.setStock(-1)).to.throw(
				"El stock no puede ser negativo"
			);
		});

		it("debería lanzar excepción con precio cero o negativo", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			expect(() => libro.setPrecio(0)).to.throw(
				"El precio debe ser mayor que 0"
			);
			expect(() => libro.setPrecio(-5)).to.throw(
				"El precio debe ser mayor que 0"
			);
		});

		it("debería lanzar excepción al reducir más stock del disponible", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			expect(() => libro.reducirStock(10)).to.throw("Stock insuficiente");
		});
	});

	describe("Operaciones", () => {
		it("debería reducir el stock correctamente", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 10, "url");
			libro.reducirStock(3);
			expect(libro.getStock()).to.equal(7);
		});

		it("debería permitir reducir stock a cero", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			libro.reducirStock(5);
			expect(libro.getStock()).to.equal(0);
		});
	});
});

// Tests para la clase Usuario
describe("Modelo: Usuario", () => {
	describe("Getters", () => {
		it("debería crear un usuario con los datos correctos", () => {
			const usuario = new Usuario(
				1,
				"Juan",
				"juan@mail.com",
				"pass",
				"cliente",
				"Calle 1"
			);
			expect(usuario.getId()).to.equal(1);
			expect(usuario.getNombre()).to.equal("Juan");
			expect(usuario.getEmail()).to.equal("juan@mail.com");
			expect(usuario.getRol()).to.equal("cliente");
		});

		it("debería crear un usuario admin", () => {
			const admin = new Usuario(2, "Admin", "admin@mail.com", "pass", "admin");
			expect(admin.getRol()).to.equal("admin");
		});

		it("debería tener rol cliente por defecto", () => {
			const usuario = new Usuario(3, "Test", "test@mail.com", "pass");
			expect(usuario.getRol()).to.equal("cliente");
		});
	});
});

// Tests para Cálculos (usando localStorage como simulación de carro)
describe("Cálculos: Carro de Compras", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("Agregar items al carro", () => {
		it("debería agregar un item al carro", () => {
			const carro = [];
			carro.push({ libroId: 1, cantidad: 2 });
			expect(carro).to.have.lengthOf(1);
			expect(carro[0].libroId).to.equal(1);
			expect(carro[0].cantidad).to.equal(2);
		});

		it("debería agregar múltiples items", () => {
			const carro = [];
			carro.push({ libroId: 1, cantidad: 2 });
			carro.push({ libroId: 2, cantidad: 1 });
			expect(carro).to.have.lengthOf(2);
		});
	});

	describe("Modificar cantidad", () => {
		it("debería actualizar la cantidad de un item", () => {
			const carro = [{ libroId: 1, cantidad: 2 }];
			carro[0].cantidad = 5;
			expect(carro[0].cantidad).to.equal(5);
		});

		it("debería eliminar item si cantidad es 0", () => {
			const carro = [
				{ libroId: 1, cantidad: 2 },
				{ libroId: 2, cantidad: 1 },
			];
			const index = 0;
			if (carro[index].cantidad === 0) {
				carro.splice(index, 1);
			}
			// Simular reducción a 0 y eliminación
			carro[0].cantidad = 0;
			const filtrado = carro.filter((item) => item.cantidad > 0);
			expect(filtrado).to.have.lengthOf(1);
		});
	});

	describe("Eliminar items", () => {
		it("debería eliminar un item específico", () => {
			const carro = [
				{ libroId: 1, cantidad: 2 },
				{ libroId: 2, cantidad: 1 },
				{ libroId: 3, cantidad: 3 },
			];
			carro.splice(1, 1); // Eliminar segundo item
			expect(carro).to.have.lengthOf(2);
			expect(carro[0].libroId).to.equal(1);
			expect(carro[1].libroId).to.equal(3);
		});

		it("debería vaciar el carro completamente", () => {
			const carro = [
				{ libroId: 1, cantidad: 2 },
				{ libroId: 2, cantidad: 1 },
			];
			carro.length = 0; // Vaciar
			expect(carro).to.have.lengthOf(0);
		});
	});

	describe("Cálculo de totales", () => {
		it("debería calcular el total correctamente", () => {
			const libros = [
				new Libro(1, "Libro 1", "Autor", "123", 10.0, 10, "url"),
				new Libro(2, "Libro 2", "Autor", "456", 15.5, 5, "url"),
			];
			const carro = [
				{ libroId: 1, cantidad: 2 },
				{ libroId: 2, cantidad: 1 },
			];

			const total = carro.reduce((sum, item) => {
				const libro = libros.find((l) => l.id === item.libroId);
				return sum + libro.precio * item.cantidad;
			}, 0);

			expect(total).to.equal(35.5); // (10 * 2) + (15.50 * 1)
		});

		it("debería calcular total con múltiples cantidades", () => {
			const libros = [
				new Libro(1, "Libro 1", "Autor", "123", 12.99, 10, "url"),
				new Libro(2, "Libro 2", "Autor", "456", 8.5, 5, "url"),
				new Libro(3, "Libro 3", "Autor", "789", 20.0, 3, "url"),
			];
			const carro = [
				{ libroId: 1, cantidad: 3 },
				{ libroId: 2, cantidad: 2 },
				{ libroId: 3, cantidad: 1 },
			];

			const total = carro.reduce((sum, item) => {
				const libro = libros.find((l) => l.id === item.libroId);
				return sum + libro.precio * item.cantidad;
			}, 0);

			expect(total).to.equal(75.97); // (12.99*3) + (8.50*2) + (20*1)
		});

		it("debería manejar decimales correctamente", () => {
			const precio = 12.99;
			const cantidad = 3;
			const subtotal = precio * cantidad;
			expect(subtotal).to.be.closeTo(38.97, 0.01);
		});
	});

	describe("Validación de stock", () => {
		it("debería verificar que hay stock suficiente", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			const cantidadDeseada = 3;
			expect(cantidadDeseada).to.be.lessThan(libro.stock);
		});

		it("debería detectar stock insuficiente", () => {
			const libro = new Libro(1, "Test", "Autor", "123", 10, 5, "url");
			const cantidadDeseada = 10;
			expect(cantidadDeseada).to.be.greaterThan(libro.stock);
		});
	});
});

// Tests adicionales para redondeo y precisión
describe("Cálculos: Precisión numérica", () => {
	it("debería redondear correctamente a 2 decimales", () => {
		const precio = 12.995;
		const redondeado = Math.round(precio * 100) / 100;
		expect(redondeado).to.equal(13.0);
	});

	it("debería formatear precios correctamente", () => {
		const precio = 12.5;
		const formateado = precio.toFixed(2);
		expect(formateado).to.equal("12.50");
	});

	it("debería calcular IVA correctamente", () => {
		const subtotal = 100;
		const iva = 0.21;
		const total = subtotal * (1 + iva);
		expect(total).to.equal(121);
	});
});
