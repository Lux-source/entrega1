import { Libro } from "/libreria/js/model/libro.mjs";
import { Usuario } from "/libreria/js/model/usuario.mjs";
import { servicioAutenticacion } from "/libreria/js/model/auth-service.mjs";
import { almacenAutenticacion } from "/libreria/js/model/auth-store.mjs";
import { session } from "/libreria/js/commons/libreria-session.mjs";
import { libreriaProxy } from "/libreria/js/model/libreria-proxy.mjs";

const { describe, it, before, beforeEach, afterEach } = window;
const { expect } = window.chai;

before(async function () {
	this.timeout(10000);
	try {
		const response = await fetch("/api/test/reiniciar", { method: "POST" });
		if (!response.ok) {
			console.warn("No se pudo reiniciar la BD:", response.status);
		}
	} catch (error) {
		console.warn("Error reiniciando BD:", error);
	}
});

const crearLibro = () =>
	new Libro("507f1f77bcf86cd799439200", "Pruebas", "QA", "qa-isbn", 25, 10);

const crearUsuario = () =>
	new Usuario(
		"507f1f77bcf86cd799439200",
		"33333333Z",
		"Pilar",
		"Test",
		"Calle QA",
		"600000003",
		"qa@mail.com",
		"ClaveQa",
		"CLIENTE"
	);

let contadorRegistro = Date.now();

const generarDatosRegistro = (overrides = {}) => {
	contadorRegistro += 1;
	const sufijo = contadorRegistro;
	return {
		dni: `${String(sufijo).slice(-8)}Z`,
		nombre: "Test",
		apellidos: "Usuario",
		direccion: "Calle Test",
		telefono: `7${String(sufijo).slice(-8)}`,
		email: `registro${sufijo}@mail.com`,
		password: "Clave99",
		passwordConfirm: "Clave99",
		rol: "CLIENTE",
		...overrides,
	};
};

const registrarUsuario = (datos) =>
	servicioAutenticacion.registrar(
		datos.dni,
		datos.nombre,
		datos.apellidos,
		datos.direccion,
		datos.telefono,
		datos.email,
		datos.password,
		datos.passwordConfirm,
		datos.rol
	);

beforeEach(() => {
	localStorage.clear();
	almacenAutenticacion.observadores = [];
	almacenAutenticacion.establecerCierreSesion();
	almacenAutenticacion.limpiarError();
	almacenAutenticacion.establecerCargando(false);
});

describe("Getters y Setters", () => {
	describe("Libro", () => {
		it("getters libros", () => {
			const libro = crearLibro();

			expect(libro.getId()).to.be.a("string");
			expect(libro.getId()).to.have.lengthOf(24);
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

		it("permite establecer stock en cero", () => {
			const libro = crearLibro();
			libro.setStock(0);
			expect(libro.getStock()).to.equal(0);
		});

		it("reduce stock correctamente cuando hay unidades suficientes", () => {
			const libro = crearLibro();
			libro.setStock(5);
			libro.reducirStock(2);
			expect(libro.getStock()).to.equal(3);
		});
	});

	describe("Usuario", () => {
		it("getters de datos personales y rol", () => {
			const usuario = crearUsuario();

			expect(usuario.getId()).to.be.a("string");
			expect(usuario.getId()).to.have.lengthOf(24);
			expect(usuario.getNombre()).to.equal("Pilar");
			expect(usuario.getApellidos()).to.equal("Test");
			expect(usuario.getEmail()).to.equal("qa@mail.com");
			expect(usuario.getRol()).to.equal("CLIENTE");
		});

		it("getters de contacto devuelven valores originales", () => {
			const usuario = crearUsuario();
			expect(usuario.getDni()).to.equal("33333333Z");
			expect(usuario.getTelefono()).to.equal("600000003");
			expect(usuario.getDireccion()).to.equal("Calle QA");
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

describe("Autenticación - iniciar sesión", () => {
	it("autentica usuario existente con credenciales válidas", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"juan@mail.com",
			"Juanperez123",
			"cliente"
		);

		expect(resultado.success).to.be.true;

		expect(resultado.usuario).to.have.property("email", "juan@mail.com");

		expect(resultado.usuario.id).to.be.a("string");
		expect(resultado.usuario.id).to.have.lengthOf(24);
		expect(resultado.token).to.be.a("string");
		expect(resultado.token.startsWith("token_")).to.be.true;
	});

	it("rechaza inicio de sesión sin email", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"",
			"Juanperez123",
			"CLIENTE"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("El email es obligatorio");
	});

	it("rechaza emails con formato incorrecto", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"no-es-email",
			"Juanperez123",
			"CLIENTE"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Email inválido");
	});

	it("rechaza contraseñas incorrectas", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"juan@mail.com",
			"ClaveErronea",
			"CLIENTE"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Credenciales de cliente invalidas");
	});

	it("rechaza contraseñas incorrectas para admin", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"admin@libreria.com",
			"ClaveErronea",
			"ADMIN"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Credenciales de administrador invalidas");
	});

	it("rechaza roles que no coinciden con el usuario", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"juan@mail.com",
			"Juanperez123",
			"ADMIN"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Credenciales de administrador invalidas");
	});

	it("rechaza usuarios inexistentes", async () => {
		const resultado = await servicioAutenticacion.iniciarSesion(
			"fantasma@mail.com",
			"Clave999",
			"CLIENTE"
		);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Credenciales de cliente invalidas");
	});
});

describe("Autenticación - registrar (validaciones)", () => {
	it("requiere todos los campos obligatorios", async () => {
		const datos = generarDatosRegistro({ nombre: " " });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Todos los campos son obligatorios");
	});

	it("valida el formato del DNI", async () => {
		const datos = generarDatosRegistro({ dni: "1234" });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal(
			"DNI inválido. Usa 8 dígitos y una letra (ej: 12345678A)"
		);
	});

	it("valida el formato del email", async () => {
		const datos = generarDatosRegistro({ email: "correo" });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Email inválido");
	});

	it("valida el teléfono", async () => {
		const datos = generarDatosRegistro({ telefono: "12" });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal(
			"Teléfono inválido. Usa solo dígitos (7-15 caracteres)"
		);
	});

	it("exige contraseñas con longitud mínima", async () => {
		const datos = generarDatosRegistro({
			password: "12345",
			passwordConfirm: "12345",
		});
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal(
			"La contraseña debe tener al menos 6 caracteres"
		);
	});

	it("valida el rol permitido", async () => {
		const datos = generarDatosRegistro({ rol: "GERENTE" });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.equal("Rol inválido. Usa ADMIN o CLIENTE");
	});

	it("impide registrar DNIs ya existentes", async () => {
		const dniDuplicado = `9${Date.now().toString().slice(-7)}A`;
		const emailUnico = `dup${Date.now()}@mail.com`;

		await servicioAutenticacion.registrar(
			dniDuplicado,
			"Test",
			"Duplicado",
			"Calle",
			"600000000",
			emailUnico,
			"Clave123",
			"Clave123"
		);

		const datos = generarDatosRegistro({
			dni: dniDuplicado,
			email: `otro${Date.now()}@mail.com`,
		});

		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.false;
		expect(resultado.error).to.include("DNI");
	});

	it("permite registrar administradores y mantiene el rol en mayúsculas", async () => {
		const datos = generarDatosRegistro({ rol: "ADMIN" });
		const resultado = await registrarUsuario(datos);
		expect(resultado.success).to.be.true;
		expect(resultado.usuario.rol).to.equal("ADMIN");

		expect(resultado.usuario.id).to.be.a("string");
		expect(resultado.usuario.id).to.have.lengthOf(24);
	});
});

describe("Autenticación - utilidades", () => {
	it("genera tokens únicos y válidos", () => {
		const token1 = servicioAutenticacion.generarToken({ id: 1 });
		const token2 = servicioAutenticacion.generarToken({ id: 1 });
		expect(token1).to.match(/^token_/);
		expect(token2).to.match(/^token_/);
		expect(token1).to.not.equal(token2);
		expect(servicioAutenticacion.verificarToken(token1)).to.be.true;
	});

	it("detecta tokens inválidos", () => {
		expect(servicioAutenticacion.verificarToken("token_valido")).to.be.true;
		expect(servicioAutenticacion.verificarToken("")).to.be.false;
		expect(servicioAutenticacion.verificarToken("sin_prefijo")).to.be.false;
	});

	it("cierra sesión devolviendo confirmación", () => {
		const resultado = servicioAutenticacion.cerrarSesion();
		expect(resultado.success).to.be.true;
		expect(resultado.message).to.equal("Sesión cerrada correctamente");
	});
});

describe("Almacén de autenticación", () => {
	it("notifica a los observadores suscritos", () => {
		const estados = [];
		const observador = (estado) => estados.push(estado);
		almacenAutenticacion.suscribir(observador);
		almacenAutenticacion.establecerCargando(true);
		almacenAutenticacion.desuscribir(observador);
		almacenAutenticacion.establecerCargando(false);
		expect(estados).to.have.lengthOf(1);
		expect(estados[0].estaCargando).to.be.true;
	});

	it("restaurarSesion devuelve false cuando no existen datos", () => {
		const resultado = almacenAutenticacion.restaurarSesion();
		expect(resultado).to.be.false;
		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.false;
	});

	it("gestiona el ciclo de errores limpiando tras mostrar", () => {
		const errores = [];
		const observador = (estado) => errores.push(estado.error);
		almacenAutenticacion.suscribir(observador);
		almacenAutenticacion.establecerError("Fallo crítico");
		almacenAutenticacion.limpiarError();
		almacenAutenticacion.desuscribir(observador);
		expect(errores[0]).to.equal("Fallo crítico");
		expect(errores[1]).to.be.null;
	});
});

describe("Persistencia de sesión", () => {
	it("obtiene claves distintas para usuarios con y sin sesión", () => {
		session.clearUser();
		const claveInvitado = session.getKeySesionCliente("carrito");
		expect(claveInvitado).to.equal("carrito_invitado");

		const testId = "507f1f77bcf86cd799439042";
		session.setUser({ id: testId, rol: "CLIENTE" });
		const claveId = session.getKeySesionCliente("carrito");
		expect(claveId).to.equal(`carrito_${testId}`);

		session.setUser({ email: "Usuario@Mail.com" });
		const claveEmail = session.getKeySesionCliente("lista");
		expect(claveEmail).to.equal("lista_usuario@mail.com");
	});

	it("lanza error cuando la clave base está vacía", () => {
		expect(() => session.getKeySesionCliente(" ")).to.throw(
			"La clave base es obligatoria para la persistencia"
		);
	});

	it("lee y escribe arrays bajo claves escopadas", () => {
		const testId = "507f1f77bcf86cd799439090";
		session.setUser({ id: testId, rol: "CLIENTE" });
		const datos = [{ libroId: 1, cantidad: 2 }];
		session.escribirArrayClienteSesion("carrito", datos);
		const almacenado = JSON.parse(localStorage.getItem(`carrito_${testId}`));
		expect(almacenado).to.deep.equal(datos);
		const recuperado = session.leerArrayClienteSesion("carrito");
		expect(recuperado).to.deep.equal(datos);
	});

	it("limpia los datos asociados al usuario", () => {
		const testId = "507f1f77bcf86cd799439077";
		session.setUser({ id: testId, rol: "CLIENTE" });
		session.escribirArrayClienteSesion("favoritos", [1, 2]);
		session.limpiarItemClienteSesion("favoritos");
		expect(localStorage.getItem(`favoritos_${testId}`)).to.be.null;
	});

	it("migra datos legados a la nueva clave por usuario", () => {
		const testId = "507f1f77bcf86cd799439051";
		session.setUser({ id: testId, rol: "CLIENTE" });
		localStorage.setItem("historial", JSON.stringify(["legacy"]));
		const resultado = session.leerArrayClienteSesion("historial");
		expect(resultado).to.deep.equal(["legacy"]);
		expect(localStorage.getItem("historial")).to.be.null;
		expect(
			JSON.parse(localStorage.getItem(`historial_${testId}`))
		).to.deep.equal(["legacy"]);
	});
});

describe("Agregar, Modificar y Eliminar", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {});

	it("agrega un usuario cliente mediante registro", async () => {
		const emailUnico = `crud${Date.now()}@mail.com`;
		const dniUnico = `8${Date.now().toString().slice(-7)}B`;

		const resultado = await servicioAutenticacion.registrar(
			dniUnico,
			"Laura",
			"Crud",
			"Calle Alta",
			"611111111",
			emailUnico,
			"Crud123",
			"Crud123"
		);

		expect(resultado.success).to.be.true;

		expect(resultado.usuario.id).to.be.a("string");
		expect(resultado.usuario.id).to.have.lengthOf(24);

		const login = await servicioAutenticacion.iniciarSesion(
			emailUnico,
			"Crud123",
			"CLIENTE"
		);
		expect(login.success).to.be.true;
	});

	it("no deja registrar emails ya existentes", async () => {
		const resultado = await servicioAutenticacion.registrar(
			"99999999Z",
			"Test",
			"Email",
			"Calle",
			"600000000",
			"juan@mail.com", // Email existente
			"Clave123",
			"Clave123"
		);

		expect(resultado.success).to.be.false;
		expect(resultado.error).to.include("Email");
	});

	it("actualiza datos del usuario en el almacén y sincroniza en nuestro almacenamiento", () => {
		const testId = "507f1f77bcf86cd799439010";
		almacenAutenticacion.establecerInicioSesion(
			{ id: testId, nombre: "Inicial", rol: "CLIENTE" },
			"token_test"
		);

		almacenAutenticacion.actualizarUsuario({
			id: testId,
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
		const testId = "507f1f77bcf86cd799439020";
		almacenAutenticacion.establecerInicioSesion(
			{ id: testId, nombre: "Tester" },
			"token_t"
		);

		almacenAutenticacion.establecerCierreSesion();
		expect(almacenAutenticacion.obtenerEstado().estaAutenticado).to.be.false;
		expect(localStorage.getItem("auth_user")).to.be.null;
		expect(localStorage.getItem("auth_token")).to.be.null;
	});

	it("restaura sesión previamente guardada en localStorage", () => {
		const testId = "507f1f77bcf86cd799439030";
		const usuario = { id: testId, nombre: "Persistente" };
		localStorage.setItem("auth_user", JSON.stringify(usuario));
		localStorage.setItem("auth_token", "token_persistente");

		const restaurada = almacenAutenticacion.restaurarSesion();
		expect(restaurada).to.be.true;
		expect(almacenAutenticacion.obtenerEstado().usuario.id).to.equal(testId);
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

	it("gestiona usuario in session storage", () => {
		const testId = "507f1f77bcf86cd799439001";
		session.setUser({ id: testId, nombre: "Demo", rol: "CLIENTE" });
		expect(session.getRole()).to.equal("cliente");
		session.clearUser();
		expect(session.getUser()).to.be.null;
	});

	it("permite añadir un libro al catálogo mediante el proxy", async () => {
		const nuevoLibro = {
			titulo: "Libro Proxy",
			autor: "Autor Proxy",
			isbn: "978-" + Date.now().toString().slice(-10),
			precio: 20,
			stock: 10,
		};
		const libroCreado = await libreriaProxy.crearLibro(nuevoLibro);
		expect(libroCreado).to.have.property("id");

		expect(libroCreado.id).to.be.a("string");
		expect(libroCreado.id).to.have.lengthOf(24);
		expect(libroCreado.titulo).to.equal(nuevoLibro.titulo);

		const libroRecuperado = await libreriaProxy.getLibroPorId(libroCreado.id);
		expect(libroRecuperado.titulo).to.equal(nuevoLibro.titulo);
	});

	it("permite modificar el stock de un libro existente mediante el proxy", async () => {
		const libros = await libreriaProxy.getLibros();
		const libro = libros[0];

		const stockInicial = libro.stock;
		const nuevoStock = stockInicial + 5;

		const libroActualizado = await libreriaProxy.actualizarLibro(libro.id, {
			stock: nuevoStock,
		});
		expect(libroActualizado.stock).to.equal(nuevoStock);
	});

	it("permite eliminar un libro del catálogo mediante el proxy", async () => {
		const nuevoLibro = {
			titulo: "Libro a Borrar",
			autor: "Autor",
			isbn: "999-" + Date.now().toString().slice(-10),
			precio: 10,
			stock: 1,
		};
		const libroCreado = await libreriaProxy.crearLibro(nuevoLibro);

		await libreriaProxy.borrarLibro(libroCreado.id);

		try {
			await libreriaProxy.getLibroPorId(libroCreado.id);
			throw new Error("Debería haber lanzado 404");
		} catch (e) {
			expect(e.message).to.include("Libro no encontrado");
		}
	});
});

describe("Cálculos", () => {
	let clienteId;

	beforeEach(async () => {
		const login = await servicioAutenticacion.iniciarSesion(
			"juan@mail.com",
			"Juanperez123",
			"cliente"
		);
		clienteId = login.usuario.id;

		try {
			await libreriaProxy.vaciarCarro(clienteId);
		} catch (e) {}
	});

	it("calcula el total de la compra mediante el proxy", async () => {
		const libros = await libreriaProxy.getLibros();
		const libro1 = libros[0]; // Libro 1: 15.95
		const libro2 = libros[1]; // Libro 2: 18.9

		await libreriaProxy.agregarItemCarro(clienteId, {
			libroId: libro1.id,
			cantidad: 3,
		});
		await libreriaProxy.agregarItemCarro(clienteId, {
			libroId: libro2.id,
			cantidad: 1,
		});

		const compraPayload = {
			clienteId: clienteId,
			items: [
				{ libroId: libro1.id, cantidad: 3 },
				{ libroId: libro2.id, cantidad: 1 },
			],
			envio: {
				nombre: "Test",
				direccion: "Test Dir",
				ciudad: "Test City",
				cp: "00000",
				telefono: "600000000",
			},
		};

		const compra = await libreriaProxy.facturar(compraPayload);

		expect(compra.total).to.be.closeTo(66.75, 0.1); // Margen por si hay envío
	});

	it("verifica que el stock se reduce tras la compra mediante el proxy", async () => {
		const libros = await libreriaProxy.getLibros();
		const libro = libros[2]; // Libro 3

		const stockInicial = libro.stock;
		const cantidadCompra = 2;

		const compraPayload = {
			clienteId: clienteId,
			items: [{ libroId: libro.id, cantidad: cantidadCompra }],
			envio: {
				nombre: "Test",
				direccion: "Test Dir",
				ciudad: "Test City",
				cp: "00000",
				telefono: "600000000",
			},
		};
		await libreriaProxy.facturar(compraPayload);

		const libroFinal = await libreriaProxy.getLibroPorId(libro.id);
		expect(libroFinal.stock).to.equal(stockInicial - cantidadCompra);
	});
});
