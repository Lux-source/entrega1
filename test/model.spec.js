import { Libro } from "../libreria/js/model/libro.mjs";
import { Usuario } from "../libreria/js/model/usuario.mjs";
import { model } from "../libreria/js/model/seeder.mjs";
import { servicioAutenticacion } from "../libreria/js/model/auth-service.mjs";
import { almacenAutenticacion } from "../libreria/js/model/auth-store.mjs";
import { session } from "../libreria/js/commons/libreria-session.mjs";

const { describe, it, beforeEach, afterEach } = window;
const { expect } = window.chai;

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

describe("Modelo: Libro", () => {
	it("crea un libro con valores por defecto coherentes", () => {
		const libro = new Libro(
			123,
			"Clean Code",
			"Robert C. Martin",
			"9780132350884",
			32.5,
			12,
			"https://example.com/portada.jpg"
		);

		expect(libro.getId()).to.equal(123);
		expect(libro.getTitulo()).to.equal("Clean Code");
		expect(libro.getPrecio()).to.equal(32.5);
		expect(libro.getStock()).to.equal(12);
		expect(libro.idioma).to.equal("Español");
		expect(libro.descripcion).to.equal("");
		expect(libro.editorial).to.equal("");
		expect(libro.paginas).to.equal(null);
	});

	it("no permite stock negativo", () => {
		const libro = new Libro(1, "Test", "Autor", "ISBN-1", 10, 5, "portada");
		expect(() => libro.setStock(-1)).to.throw("El stock no puede ser negativo");
	});

	it("no permite precios menores o iguales a cero", () => {
		const libro = new Libro(2, "Test", "Autor", "ISBN-2", 10, 5, "portada");
		expect(() => libro.setPrecio(0)).to.throw("El precio debe ser mayor que 0");
		expect(() => libro.setPrecio(-5)).to.throw(
			"El precio debe ser mayor que 0"
		);
	});

	it("reduce stock respetando la disponibilidad", () => {
		const libro = new Libro(3, "Test", "Autor", "ISBN-3", 10, 3, "portada");
		libro.reducirStock(2);
		expect(libro.getStock()).to.equal(1);
		expect(() => libro.reducirStock(5)).to.throw("Stock insuficiente");
	});
});

describe("Modelo: Usuario", () => {
	it("normaliza el rol y expone getters", () => {
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

	it("garantiza que los identificadores de libros son únicos", () => {
		const ids = model.libros.map((libro) => libro.getId());
		expect(new Set(ids).size).to.equal(ids.length);
	});
});

describe("Servicio de autenticación", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("permite iniciar sesión con email y rol correctos", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"admin@libreria.com",
			"Admin123",
			"ADMIN"
		);

		expect(resultado.success).to.be.true;
		expect(resultado.usuario).to.have.property("email", "admin@libreria.com");
		expect(resultado.token).to.match(/^token_/);
	});

	it("rechaza identificadores que no sean emails válidos", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"00000000A",
			"Admin123",
			"ADMIN"
		);

		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Email inválido");
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

		it("valida formato de DNI y email", async () => {
			const resultadoDni = await servicioAutenticacion.registrar(
				"123",
				"Lucía",
				"Fernández",
				"Calle Luna 1",
				"600777777",
				emailRegistro,
				"ClaveSegura",
				"ClaveSegura"
			);
			expect(resultadoDni.success).to.be.false;
			expect(resultadoDni.error).to.match(/DNI inválido/i);

			const resultadoEmail = await servicioAutenticacion.registrar(
				"34567890Z",
				"Lucía",
				"Fernández",
				"Calle Luna 1",
				"600777777",
				"correo-invalido",
				"ClaveSegura",
				"ClaveSegura"
			);
			expect(resultadoEmail.success).to.be.false;
			expect(resultadoEmail.error).to.equal("Email inválido");
		});

		it("detecta contraseñas que no coinciden", async () => {
			const resultado = await servicioAutenticacion.registrar(
				"34567890Z",
				"Lucía",
				"Fernández",
				"Calle Luna 1",
				"600777777",
				emailRegistro,
				"ClaveSegura",
				"OtraClave"
			);

			expect(resultado.success).to.be.false;
			expect(resultado.error).to.equal("Las contraseñas no coinciden");
		});

		it("no permite registrar DNIs ni emails duplicados", async () => {
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
				"ClaveSegura",
				"ClaveSegura"
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

		const estado = almacenAutenticacion.obtenerEstado();
		expect(estado.estaAutenticado).to.be.true;
		expect(estado.usuario).to.deep.equal({ id: 10, nombre: "Tester" });
		expect(localStorage.getItem("auth_user")).to.be.a("string");
		expect(estados).to.have.length.greaterThan(0);

		almacenAutenticacion.desuscribir(observer);
	});

	it("gestiona banderas de carga y error", () => {
		const estados = [];
		const observer = (state) => estados.push(state);
		almacenAutenticacion.suscribir(observer);

		almacenAutenticacion.establecerCargando(true);
		expect(almacenAutenticacion.obtenerEstado().estaCargando).to.be.true;

		almacenAutenticacion.establecerError("Fallo puntual");
		const { error, estaCargando } = almacenAutenticacion.obtenerEstado();
		expect(error).to.equal("Fallo puntual");
		expect(estaCargando).to.be.false;
		expect(estados.length).to.be.greaterThan(1);

		almacenAutenticacion.limpiarError();
		expect(almacenAutenticacion.obtenerEstado().error).to.be.null;

		almacenAutenticacion.desuscribir(observer);
	});

	it("actualiza datos del usuario y sincroniza localStorage", () => {
		almacenAutenticacion.establecerInicioSesion(
			{ id: 99, nombre: "Inicial" },
			"token_inicial"
		);

		almacenAutenticacion.actualizarUsuario({ id: 99, nombre: "Actualizado" });
		const estado = almacenAutenticacion.obtenerEstado();

		expect(estado.usuario).to.deep.equal({ id: 99, nombre: "Actualizado" });
		expect(JSON.parse(localStorage.getItem("auth_user"))).to.deep.equal({
			id: 99,
			nombre: "Actualizado",
		});
	});

	it("restaura automáticamente la sesión almacenada", () => {
		const usuario = { id: 45, nombre: "Persistente" };
		localStorage.setItem("auth_user", JSON.stringify(usuario));
		localStorage.setItem("auth_token", "token_persistente");

		const restaurada = almacenAutenticacion.restaurarSesion();

		expect(restaurada).to.be.true;
		const estado = almacenAutenticacion.obtenerEstado();
		expect(estado.usuario).to.deep.equal(usuario);
		expect(estado.estaAutenticado).to.be.true;
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

	it("emite eventos al añadir mensajes y vacía la cola al consumir", () => {
		let eventos = 0;
		const listener = () => {
			eventos += 1;
		};

		window.addEventListener("messages-updated", listener);

		session.pushSuccess("Operación correcta");
		session.pushError("Ha fallado");
		session.pushInfo("Información general");

		const mensajes = session.consume();

		expect(eventos).to.equal(3);
		expect(mensajes).to.have.lengthOf(3);
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
