import { Libro } from "../libreria/js/model/libro.mjs";
import { Usuario } from "../libreria/js/model/usuario.mjs";
import { model } from "../libreria/js/model/seeder.mjs";
import { servicioAutenticacion } from "../libreria/js/model/auth-service.mjs";
import { almacenAutenticacion } from "../libreria/js/model/auth-store.mjs";
import { session } from "../libreria/js/commons/libreria-session.mjs";

const { describe, it, beforeEach, afterEach } = window;
const { expect } = window.chai;

const crearLibro = () =>
	new Libro(200, "Pruebas", "QA", "qa-isbn", 25, 10, "portada");

const crearUsuario = () =>
	new Usuario(
		200,
		"33333333Z",
		"Pilar",
		"Test",
		"Calle QA",
		"600000003",
		"qa@mail.com",
		"ClaveQa",
		"CLIENTE"
	);

const limpiarUsuarioRegistrado = (email) => {
	const index = model.usuarios.findIndex((usr) => {
		const correo =
			typeof usr.getEmail === "function" ? usr.getEmail() : usr.email;
		return correo?.toLowerCase() === email.toLowerCase();
	});
	if (index >= 0) {
		model.usuarios.splice(index, 1);
	}
};

const limpiarLibroRegistrado = (isbn) => {
	const index = model.libros.findIndex((libro) => {
		const actual = libro.isbn ?? libro.getIsbn?.();
		return actual?.toLowerCase() === isbn.toLowerCase();
	});
	if (index >= 0) {
		model.libros.splice(index, 1);
	}
};

describe("Getters y Setters", () => {
	describe("Libro", () => {
		it("getters libros", () => {
			const libro = crearLibro();
			expect(libro.getId()).to.equal(200);
			expect(libro.getTitulo()).to.equal("Pruebas");
			expect(libro.getPrecio()).to.equal(25);
			expect(libro.getStock()).to.equal(10);
		});

		it("actualizar precio y stock con valores ok", () => {
			const libro = crearLibro();
			libro.setPrecio(30);
			libro.setStock(8);
			expect(libro.getPrecio()).to.equal(30);
			expect(libro.getStock()).to.equal(8);
		});
	});

	describe("Usuario", () => {
		it("getters de datos personales y rol", () => {
			const usuario = crearUsuario();
			expect(usuario.getId()).to.equal(200);
			expect(usuario.getNombre()).to.equal("Pilar");
			expect(usuario.getApellidos()).to.equal("Test");
			expect(usuario.getEmail()).to.equal("qa@mail.com");
			expect(usuario.getRol()).to.equal("CLIENTE");
		});
	});
});

describe("Excepciones", () => {
	it("lanza al establecer precio igual o menor a cero", () => {
		const libro = crearLibro();
		expect(() => libro.setPrecio(0)).to.throw("El precio debe ser mayor que 0");
		expect(() => libro.setPrecio(-5)).to.throw(
			"El precio debe ser mayor que 0"
		);
	});

	it("lanza al establecer stock negativo", () => {
		const libro = crearLibro();
		expect(() => libro.setStock(-3)).to.throw("El stock no puede ser negativo");
	});

	it("lanza al reducir stock por encima del disponible", () => {
		const libro = crearLibro();
		expect(() => libro.reducirStock(20)).to.throw("Stock insuficiente");
	});

	it("rechaza registro cuando las contraseñas no coinciden", async () => {
		const resultado = await servicioAutenticacion.registrar(
			"33333333Z",
			"Pilar",
			"Test",
			"Calle QA",
			"600000003",
			"qa@mail.com",
			"ClaveQa",
			"OtraContra:P"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Las contraseñas no coinciden");
	});
});

describe("Agregar, Modificar y Eliminar", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		limpiarUsuarioRegistrado("crud@mail.com");
		limpiarLibroRegistrado("crud-isbn");
	});

	it("agrega un usuario cliente mediante registro", async () => {
		const resultado = await servicioAutenticacion.registrar(
			"44444444X",
			"Laura",
			"Crud",
			"Calle Alta",
			"611111111",
			"crud@mail.com",
			"Crud123",
			"Crud123"
		);

		expect(resultado.success).to.be.true;
		expect(model.usuarios.some((usr) => usr.getEmail?.() === "crud@mail.com"))
			.to.be.true;
	});

	it("no deja registrar emails ya existentes", async () => {
		const existente = model.usuarios[0];
		const resultado = await servicioAutenticacion.registrar(
			existente.getDni(),
			existente.getNombre(),
			existente.getApellidos(),
			existente.getDireccion(),
			existente.getTelefono(),
			existente.getEmail(),
			"Clave123",
			"Clave123"
		);

		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Este email ya está registrado");
	});

	it("actualiza datos del usuario en el almacén y sincroniza en nuestro almacenamiento", () => {
		almacenAutenticacion.establecerInicioSesion(
			{ id: 10, nombre: "Inicial", rol: "CLIENTE" },
			"token_test"
		);

		almacenAutenticacion.actualizarUsuario({
			id: 10,
			nombre: "Actualizado",
			rol: "CLIENTE",
		});

		expect(almacenAutenticacion.obtenerEstado().usuario.nombre).to.equal(
			"Actualizado"
		);
		const almacenado = JSON.parse(localStorage.getItem("auth_user"));
		expect(almacenado.nombre).to.equal("Actualizado");
	});

	it("cierra sesión limpiando el almacenamiento", () => {
		almacenAutenticacion.establecerInicioSesion(
			{ id: 20, nombre: "Tester" },
			"token_t"
		);

		almacenAutenticacion.establecerCierreSesion();
		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.false;
		expect(localStorage.getItem("auth_user")).to.be.null;
		expect(localStorage.getItem("auth_token")).to.be.null;
	});

	it("restaura sesión previamente guardada en localStorage", () => {
		const usuario = { id: 30, nombre: "Persistente" };
		localStorage.setItem("auth_user", JSON.stringify(usuario));
		localStorage.setItem("auth_token", "token_persistente");

		const restaurada = almacenAutenticacion.restaurarSesion();
		expect(restaurada).to.be.true;
		expect(almacenAutenticacion.obtenerEstado().usuario.id).to.equal(30);
	});

	it("almacena y limpia mensajes en session", () => {
		session.pushSuccess("ok");
		session.pushError("mal");
		session.pushInfo("info");
		const mensajes = session.consume();

		expect(mensajes.map((m) => m.type)).to.deep.equal([
			"success",
			"error",
			"info",
		]);
		expect(session.consume()).to.have.lengthOf(0);
	});

	it("gestiona usuario en session storage", () => {
		session.setUser({ id: 1, nombre: "Demo", rol: "CLIENTE" });
		expect(session.getRole()).to.equal("cliente");
		session.clearUser();
		expect(session.getUser()).to.be.null;
	});

	it("permite añadir manualmente un libro al catálogo", () => {
		model.libros.push(
			new Libro(999, "Manual", "Autor", "crud-isbn", 10, 1, "")
		);
		const encontrado = model.libros.find((libro) => libro.isbn === "crud-isbn");
		expect(encontrado).to.exist;
		limpiarLibroRegistrado("crud-isbn");
	});

	it("permite modificar el stock de un libro existente", () => {
		const libro = model.libros[0];
		const stockInicial = libro.getStock();
		libro.setStock(stockInicial + 5);
		expect(libro.getStock()).to.equal(stockInicial + 5);
	});

	it("permite eliminar un libro del catálogo local", () => {
		const libro = new Libro(800, "Eliminar", "Autor", "crud-isbn", 10, 1, "");
		model.libros.push(libro);
		const index = model.libros.indexOf(libro);
		model.libros.splice(index, 1);
		expect(model.libros.includes(libro)).to.be.false;
	});
});

describe("Cálculos", () => {
	it("calcula el subtotal del carrito", () => {
		const carrito = [
			{ libroId: 1, cantidad: 3 },
			{ libroId: 2, cantidad: 1 },
		];

		const subtotal = carrito.reduce((total, item) => {
			const libro = model.libros.find((lib) => lib.getId() === item.libroId);
			return total + libro.getPrecio() * item.cantidad;
		}, 0);

		expect(subtotal).to.be.closeTo(15.95 * 3 + 18.9, 0.001);
	});

	it("suma envío fijo cuando existe subtotal positivo", () => {
		const subtotal = 50;
		const envio = subtotal > 0 ? 4.99 : 0;
		const total = subtotal + envio;

		expect(total).to.equal(54.99);
	});

	it("calcula ahorro respecto a precio original", () => {
		const libro = crearLibro();
		const precioOriginal = 30;
		const ahorro = precioOriginal - libro.getPrecio();
		expect(ahorro).to.equal(5);
	});
});
