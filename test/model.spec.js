import { Libro } from "../libreria/js/model/libro.js";
import { Usuario } from "../libreria/js/model/usuario.js";
import { model } from "../libreria/js/model/index.js";
import { servicioAutenticacion } from "../libreria/js/model/auth-service.js";
import { almacenAutenticacion } from "../libreria/js/model/auth-store.js";
import { session } from "../libreria/js/commons/libreria-session.mjs";

const { describe, it, beforeEach, afterEach } = window;
const { expect } = window.chai;

// Helper: nos quita los usuarios registrados por el seed por si da problemas
const limpiarUsuarioRegistrado = (email) => {
	const index = model.usuarios.findIndex((usr) => {
		if (typeof usr.getEmail === "function") {
			return usr.getEmail()?.toLowerCase() === email.toLowerCase();
		}
		return usr.email?.toLowerCase() === email.toLowerCase();
	});

	if (index >= 0) {
		model.usuarios.splice(index, 1);
	}
};

describe("Modelo: Libro", () => {
	it("crea un libro con los datos obligatorios y defaults", () => {
		const libro = new Libro(
			99,
			"Clean Code",
			"Robert C. Martin",
			"9780132350884",
			32.5,
			12,
			"zzzzzzzzzz"
		);

		expect(libro.getId()).to.equal(99);
		expect(libro.getTitulo()).to.equal("Clean Code");
		expect(libro.getPrecio()).to.equal(32.5);
		expect(libro.getStock()).to.equal(12);
		expect(libro.idioma).to.equal("Español");
	});

	it("no permite stock negativo", () => {
		const libro = new Libro(1, "Test", "Autor", "111", 10, 5, "url");

		expect(() => libro.setStock(-4)).to.throw("El stock no puede ser negativo");
	});

	it("no permite precios menores o iguales a cero", () => {
		const libro = new Libro(2, "Test", "Autor", "222", 10, 5, "url");

		expect(() => libro.setPrecio(0)).to.throw("El precio debe ser mayor que 0");
		expect(() => libro.setPrecio(-5)).to.throw(
			"El precio debe ser mayor que 0"
		);
	});

	it("reduce el stock respetando la disponibilidad", () => {
		const libro = new Libro(3, "Test", "Autor", "333", 10, 3, "url");

		libro.reducirStock(2);
		expect(libro.getStock()).to.equal(1);
		expect(() => libro.reducirStock(5)).to.throw("Stock insuficiente");
	});
});

describe("Modelo: Usuario", () => {
	it("normaliza el rol y expone los getters", () => {
		const usuario = new Usuario(
			50,
			"99999999Z",
			"Ana",
			"López",
			"Calle 123",
			"600123456",
			"ana@mail.com",
			"ClaveSegura",
			"cliente"
		);

		expect(usuario.getId()).to.equal(50);
		expect(usuario.getNombre()).to.equal("Ana");
		expect(usuario.getEmail()).to.equal("ana@mail.com");
		expect(usuario.getRol()).to.equal("CLIENTE");
	});

	it("asigna CLIENTE por defecto cuando no se especifica rol", () => {
		const usuario = new Usuario(
			60,
			"12345678A",
			"Luis",
			"Martínez",
			"Av. España",
			"600654321",
			"luis@mail.com",
			"Claveok"
		);

		expect(usuario.getRol()).to.equal("CLIENTE");
	});
});

describe("Modelo: Seed de datos", () => {
	it("carga usuarios y libros base", () => {
		expect(model.usuarios.length).to.be.at.least(3);
		expect(model.libros.length).to.be.at.least(6);

		const admin = model.usuarios.find((usr) => usr.getRol() === "ADMIN");
		expect(admin).to.exist;
	});
});

describe("Servicio de autenticación", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("permite iniciar sesión con credenciales y rol correctos", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"admin@libreria.com",
			"Admin123",
			"ADMIN"
		);

		expect(resultado.success).to.be.true;
		expect(resultado.usuario).to.have.property("email", "admin@libreria.com");
		expect(resultado.token).to.match(/^token_/);
	});

	it("rechaza login con contraseña incorrecta", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"admin@libreria.com",
			"Clavemala",
			"ADMIN"
		);

		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Contraseña incorrecta");
	});

	it("rechaza login con rol incorrecto", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"admin@libreria.com",
			"Admin123",
			"CLIENTE"
		);

		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Rol incorrecto para este usuario");
	});

	describe("Registro", () => {
		const emailRegistro = "nuevo@cliente.com";

		afterEach(() => {
			limpiarUsuarioRegistrado(emailRegistro);
		});

		it("valida campos obligatorios", async () => {
			const resultado = await servicioAutenticacion.registrar(
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				""
			);

			expect(resultado.success).to.be.false;
			expect(resultado.error).to.equal("Todos los campos son obligatorios");
		});

		it("no permite registrar DNIs y emails duplicados", async () => {
			const existente = model.usuarios[1];
			const resultado = await servicioAutenticacion.registrar(
				existente.getDni(),
				existente.getNombre(),
				existente.getApellidos(),
				existente.getDireccion(),
				existente.getTelefono(),
				existente.getEmail(),
				"Claveok",
				"Claveok"
			);

			expect(resultado.success).to.be.false;
			expect(resultado.error).to.equal("Este email ya está registrado");
		});

		it("registra nuevos usuarios cliente y genera token", async () => {
			const resultado = await servicioAutenticacion.registrar(
				"34567890Z",
				"Lucía",
				"Fernández",
				"Calle Luna 1",
				"600777777",
				emailRegistro,
				"ClaveMeh",
				"ClaveMeh"
			);

			expect(resultado.success).to.be.true;
			expect(resultado.usuario.getEmail()).to.equal(emailRegistro);
			expect(resultado.token).to.match(/^token_/);

			const almacenado = model.usuarios.find(
				(usr) => usr.getEmail() === emailRegistro
			);
			expect(almacenado).to.exist;
			expect(almacenado.getRol()).to.equal("CLIENTE");
		});
	});
});

describe("AlmacenAutenticacion", () => {
	beforeEach(() => {
		localStorage.clear();
		almacenAutenticacion.establecerCierreSesion();
	});

	it("almacena sesión y notifica a los suscriptores", () => {
		const estados = [];
		const observer = (state) => estados.push(state);

		almacenAutenticacion.suscribir(observer);
		almacenAutenticacion.establecerInicioSesion(
			{ id: 10, nombre: "Tester" },
			"token_test"
		);

		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.true;
		expect(localStorage.getItem("auth_user")).to.be.a("string");
		expect(estados).to.have.length.greaterThan(0);

		almacenAutenticacion.desuscribir(observer);
	});

	it("limpia la sesión al cerrar sesión", () => {
		almacenAutenticacion.establecerInicioSesion({ id: 1 }, "token");
		almacenAutenticacion.establecerCierreSesion();

		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.false;
		expect(localStorage.getItem("auth_user")).to.be.null;
		expect(localStorage.getItem("auth_token")).to.be.null;
	});

	it("restaura automáticamente la sesión almacenada", () => {
		const usuario = { id: 45, nombre: "Persistente" };
		localStorage.setItem("auth_user", JSON.stringify(usuario));
		localStorage.setItem("auth_token", "token_persistente");

		const restaurada = almacenAutenticacion.restaurarSesion();

		expect(restaurada).to.be.true;
		expect(almacenAutenticacion.obtenerEstado().usuario).to.deep.equal(usuario);
		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.true;
	});
});

describe("LibreriaSession", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("gestiona usuario y rol en localStorage", () => {
		expect(session.getRole()).to.equal("invitado");

		const user = { id: 1, nombre: "Invitado", rol: "CLIENTE" };
		session.setUser(user);

		expect(session.getUser()).to.deep.equal(user);
		expect(session.getRole()).to.equal("cliente");

		session.clearUser();

		expect(session.getUser()).to.be.null;
		expect(session.getRole()).to.equal("invitado");
	});

	it("emite eventos y permite consumir la cola de mensajes", () => {
		let eventos = 0;
		const listener = () => {
			eventos += 1;
		};

		window.addEventListener("messages-updated", listener);

		session.pushSuccess("Operación correcta");
		session.pushError("Ha fallado");

		const mensajes = session.consume();

		expect(eventos).to.equal(2);
		expect(mensajes).to.have.lengthOf(2);
		expect(session.consume()).to.have.lengthOf(0);

		window.removeEventListener("messages-updated", listener);
	});
});

describe("Cálculos en carro de compras", () => {
	it("calcula subtotales y totales como en la vista de pago", () => {
		const mockCarro = [
			{ libroId: 1, cantidad: 2 },
			{ libroId: 3, cantidad: 1 },
		];

		const subtotal = mockCarro.reduce((acumulado, item) => {
			const libro = model.libros.find((lib) => lib.getId() === item.libroId);
			return acumulado + libro.getPrecio() * item.cantidad;
		}, 0);

		expect(subtotal).to.be.closeTo(15.95 * 2 + 12.5, 0.001);

		const shipping = subtotal > 0 ? 4.99 : 0;
		const total = subtotal + shipping;

		expect(total).to.be.closeTo(subtotal + 4.99, 0.001);
	});
});
