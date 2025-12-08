import chai from "chai";
import { conectarDB, desconectarDB } from "../server/config/database.mjs";
import { db } from "../server/data/db-context.mjs";
import Libro from "../server/models/libro.model.mjs";
import Usuario from "../server/models/usuario.model.mjs";
import Factura from "../server/models/factura.model.mjs";
import Carro from "../server/models/carro.model.mjs";

const expect = chai.expect;

describe("PRUEBAS DE MODELO", () => {
	before(async function () {
		this.timeout(10000);
		await conectarDB();
		await db.reiniciar();
	});

	after(async () => {
		await db.reiniciar();
		await desconectarDB();
	});

	describe("Getters y Setters", () => {
		describe("Libro - Verificación de todos los atributos", () => {
			it("crea un libro y verifica todos sus atributos", async () => {
				const datosLibro = {
					titulo: "El Quijote",
					autor: "Miguel de Cervantes",
					isbn: "978-84-000-0001-1",
					precio: 25.99,
					stock: 50,
				};

				const libro = await Libro.create(datosLibro);
				const libroJSON = libro.toJSON();

				expect(libroJSON.id).to.be.a("string");
				expect(libroJSON.id).to.have.lengthOf(24);
				expect(libroJSON.titulo).to.equal(datosLibro.titulo);
				expect(libroJSON.autor).to.equal(datosLibro.autor);
				expect(libroJSON.isbn).to.equal(datosLibro.isbn);
				expect(libroJSON.precio).to.equal(datosLibro.precio);
				expect(libroJSON.stock).to.equal(datosLibro.stock);

				await Libro.findByIdAndDelete(libro._id);
			});

			it("recupera un libro por ID y verifica todos sus atributos", async () => {
				const datosLibro = {
					titulo: "Cien años de soledad",
					autor: "Gabriel García Márquez",
					isbn: "978-84-000-0002-2",
					precio: 18.5,
					stock: 30,
				};

				const libroCreado = await Libro.create(datosLibro);
				const libroRecuperado = await Libro.findById(libroCreado._id);
				const libroJSON = libroRecuperado.toJSON();

				expect(libroJSON.id).to.equal(libroCreado._id.toString());
				expect(libroJSON.titulo).to.equal(datosLibro.titulo);
				expect(libroJSON.autor).to.equal(datosLibro.autor);
				expect(libroJSON.isbn).to.equal(datosLibro.isbn);
				expect(libroJSON.precio).to.equal(datosLibro.precio);
				expect(libroJSON.stock).to.equal(datosLibro.stock);

				await Libro.findByIdAndDelete(libroCreado._id);
			});

			it("actualiza precio y stock y verifica cambios", async () => {
				const libro = await Libro.create({
					titulo: "Test Update",
					autor: "Test Author",
					isbn: "978-84-000-0003-3",
					precio: 10.0,
					stock: 5,
				});

				await libro.actualizarPrecio(15.99);
				await libro.actualizarStock(20);

				const libroActualizado = await Libro.findById(libro._id);
				expect(libroActualizado.precio).to.equal(15.99);
				expect(libroActualizado.stock).to.equal(20);

				await Libro.findByIdAndDelete(libro._id);
			});
		});

		describe("Usuario - Verificación de todos los atributos", () => {
			it("crea un usuario cliente y verifica todos sus atributos", async () => {
				const datosUsuario = {
					dni: "12345678A",
					nombre: "Juan",
					apellidos: "Pérez García",
					direccion: "Calle Mayor 123",
					telefono: "600111222",
					email: "juan.test@mail.com",
					password: "Password123",
					rol: "CLIENTE",
				};

				const usuario = await Usuario.create(datosUsuario);
				const usuarioJSON = usuario.toJSON();
				expect(usuarioJSON.id).to.be.a("string");
				expect(usuarioJSON.id).to.have.lengthOf(24);
				expect(usuarioJSON.dni).to.equal(datosUsuario.dni);
				expect(usuarioJSON.nombre).to.equal(datosUsuario.nombre);
				expect(usuarioJSON.apellidos).to.equal(datosUsuario.apellidos);
				expect(usuarioJSON.direccion).to.equal(datosUsuario.direccion);
				expect(usuarioJSON.telefono).to.equal(datosUsuario.telefono);
				expect(usuarioJSON.email).to.equal(datosUsuario.email.toLowerCase());
				expect(usuarioJSON.rol).to.equal(datosUsuario.rol);
				expect(usuarioJSON.password).to.be.undefined;

				await Usuario.findByIdAndDelete(usuario._id);
			});

			it("crea un usuario admin y verifica todos sus atributos", async () => {
				const datosAdmin = {
					dni: "87654321B",
					nombre: "Admin",
					apellidos: "Sistema Principal",
					direccion: "Oficina Central 1",
					telefono: "900123456",
					email: "admin.test@libreria.com",
					password: "AdminPass123",
					rol: "ADMIN",
				};

				const admin = await Usuario.create(datosAdmin);
				const adminJSON = admin.toJSON();

				expect(adminJSON.id).to.be.a("string");
				expect(adminJSON.id).to.have.lengthOf(24);
				expect(adminJSON.dni).to.equal(datosAdmin.dni);
				expect(adminJSON.nombre).to.equal(datosAdmin.nombre);
				expect(adminJSON.apellidos).to.equal(datosAdmin.apellidos);
				expect(adminJSON.direccion).to.equal(datosAdmin.direccion);
				expect(adminJSON.telefono).to.equal(datosAdmin.telefono);
				expect(adminJSON.email).to.equal(datosAdmin.email.toLowerCase());
				expect(adminJSON.rol).to.equal("ADMIN");

				await Usuario.findByIdAndDelete(admin._id);
			});

			it("verifica que la contraseña se hashea correctamente", async () => {
				const passwordOriginal = "MiPassword123";
				const usuario = await Usuario.create({
					dni: "11111111C",
					nombre: "Test",
					apellidos: "Password",
					direccion: "Calle Test",
					telefono: "600000001",
					email: "test.password@mail.com",
					password: passwordOriginal,
					rol: "CLIENTE",
				});
				expect(usuario.password).to.not.equal(passwordOriginal);
				const esValida = await usuario.compararPassword(passwordOriginal);
				expect(esValida).to.be.true;

				await Usuario.findByIdAndDelete(usuario._id);
			});
		});

		describe("Factura - Verificación de todos los atributos", () => {
			let clienteId;
			let libroId;

			before(async () => {
				const cliente = await Usuario.create({
					dni: "22222222D",
					nombre: "Cliente",
					apellidos: "Factura Test",
					direccion: "Calle Factura",
					telefono: "600222333",
					email: "cliente.factura@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});
				clienteId = cliente._id;

				const libro = await Libro.create({
					titulo: "Libro Factura",
					autor: "Autor Factura",
					isbn: "978-84-000-0004-4",
					precio: 20.0,
					stock: 100,
				});
				libroId = libro._id;
			});

			after(async () => {
				await Usuario.findByIdAndDelete(clienteId);
				await Libro.findByIdAndDelete(libroId);
			});

			it("crea una factura y verifica todos sus atributos", async () => {
				const datosFactura = {
					numero: "FAC-TEST-001",
					fecha: new Date("2025-12-08T10:00:00Z"),
					clienteId: clienteId,
					items: [{ libroId: libroId, cantidad: 3 }],
					total: 60.0,
					envio: {
						nombre: "Cliente Factura Test",
						direccion: "Calle Envío 123",
						ciudad: "Madrid",
						cp: "28001",
						telefono: "600444555",
					},
				};

				const factura = await Factura.create(datosFactura);
				const facturaJSON = factura.toJSON();
				expect(facturaJSON.id).to.be.a("string");
				expect(facturaJSON.id).to.have.lengthOf(24);
				expect(facturaJSON.numero).to.equal(datosFactura.numero);
				expect(facturaJSON.fecha).to.be.a("string");
				expect(facturaJSON.clienteId).to.equal(clienteId.toString());
				expect(facturaJSON.total).to.equal(datosFactura.total);

				expect(facturaJSON.items).to.be.an("array");
				expect(facturaJSON.items).to.have.lengthOf(1);
				expect(facturaJSON.items[0].libroId).to.equal(libroId.toString());
				expect(facturaJSON.items[0].cantidad).to.equal(3);
				expect(facturaJSON.envio).to.be.an("object");
				expect(facturaJSON.envio.nombre).to.equal(datosFactura.envio.nombre);
				expect(facturaJSON.envio.direccion).to.equal(
					datosFactura.envio.direccion
				);
				expect(facturaJSON.envio.ciudad).to.equal(datosFactura.envio.ciudad);
				expect(facturaJSON.envio.cp).to.equal(datosFactura.envio.cp);
				expect(facturaJSON.envio.telefono).to.equal(
					datosFactura.envio.telefono
				);

				await Factura.findByIdAndDelete(factura._id);
			});

			it("genera número de factura automáticamente", async () => {
				const numero = await Factura.generarNumeroFactura();
				expect(numero).to.match(/^FAC-\d{4}$/);
			});
		});

		describe("Carro - Verificación de todos los atributos", () => {
			let clienteId;
			let libroId;

			before(async () => {
				const cliente = await Usuario.create({
					dni: "33333333E",
					nombre: "Cliente",
					apellidos: "Carro Test",
					direccion: "Calle Carro",
					telefono: "600333444",
					email: "cliente.carro@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});
				clienteId = cliente._id;

				const libro = await Libro.create({
					titulo: "Libro Carro",
					autor: "Autor Carro",
					isbn: "978-84-000-0005-5",
					precio: 15.0,
					stock: 50,
				});
				libroId = libro._id;
			});

			after(async () => {
				await Carro.deleteMany({ clienteId });
				await Usuario.findByIdAndDelete(clienteId);
				await Libro.findByIdAndDelete(libroId);
			});

			it("crea un carro y verifica todos sus atributos", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [{ libroId: libroId, cantidad: 2 }],
				});
				const carroJSON = carro.toJSON();

				expect(carroJSON.id).to.be.a("string");
				expect(carroJSON.id).to.have.lengthOf(24);
				expect(carroJSON.clienteId).to.equal(clienteId.toString());
				expect(carroJSON.items).to.be.an("array");
				expect(carroJSON.items).to.have.lengthOf(1);
				expect(carroJSON.items[0].libroId).to.equal(libroId.toString());
				expect(carroJSON.items[0].cantidad).to.equal(2);

				await Carro.findByIdAndDelete(carro._id);
			});
		});
	});

	describe("Excepciones", () => {
		describe("Libro - Validaciones", () => {
			it("rechaza crear libro sin título", async () => {
				try {
					await Libro.create({
						autor: "Autor",
						isbn: "978-00-000-0001",
						precio: 10,
						stock: 5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("título");
				}
			});

			it("rechaza crear libro sin autor", async () => {
				try {
					await Libro.create({
						titulo: "Título",
						isbn: "978-00-000-0002",
						precio: 10,
						stock: 5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("autor");
				}
			});

			it("rechaza crear libro sin ISBN", async () => {
				try {
					await Libro.create({
						titulo: "Título",
						autor: "Autor",
						precio: 10,
						stock: 5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("ISBN");
				}
			});

			it("rechaza precio menor o igual a cero", async () => {
				try {
					await Libro.create({
						titulo: "Test",
						autor: "Test",
						isbn: "978-00-000-0003",
						precio: 0,
						stock: 5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("precio");
				}
			});

			it("rechaza precio negativo", async () => {
				try {
					await Libro.create({
						titulo: "Test",
						autor: "Test",
						isbn: "978-00-000-0004",
						precio: -10,
						stock: 5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("precio");
				}
			});

			it("rechaza stock negativo", async () => {
				try {
					await Libro.create({
						titulo: "Test",
						autor: "Test",
						isbn: "978-00-000-0005",
						precio: 10,
						stock: -5,
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("stock");
				}
			});

			it("rechaza reducir stock por encima del disponible", async () => {
				const libro = await Libro.create({
					titulo: "Test Stock",
					autor: "Test",
					isbn: "978-00-000-0006",
					precio: 10,
					stock: 5,
				});

				try {
					await libro.reducirStock(10);
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("Stock insuficiente");
				}

				await Libro.findByIdAndDelete(libro._id);
			});

			it("rechaza actualizar precio a valor no válido", async () => {
				const libro = await Libro.create({
					titulo: "Test Precio",
					autor: "Test",
					isbn: "978-00-000-0007",
					precio: 10,
					stock: 5,
				});

				try {
					await libro.actualizarPrecio(-5);
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("precio");
				}

				await Libro.findByIdAndDelete(libro._id);
			});
		});

		describe("Usuario - Validaciones", () => {
			it("rechaza DNI con formato inválido", async () => {
				try {
					await Usuario.create({
						dni: "1234",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "test@mail.com",
						password: "Pass123",
						rol: "CLIENTE",
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("DNI");
				}
			});

			it("rechaza email con formato inválido", async () => {
				try {
					await Usuario.create({
						dni: "44444444F",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "no-es-email",
						password: "Pass123",
						rol: "CLIENTE",
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("email");
				}
			});

			it("rechaza teléfono con formato inválido", async () => {
				try {
					await Usuario.create({
						dni: "55555555G",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "12",
						email: "test2@mail.com",
						password: "Pass123",
						rol: "CLIENTE",
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("teléfono");
				}
			});

			it("rechaza contraseña menor a 6 caracteres", async () => {
				try {
					await Usuario.create({
						dni: "66666666H",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "test3@mail.com",
						password: "12345",
						rol: "CLIENTE",
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("contraseña");
				}
			});

			it("rechaza rol inválido", async () => {
				try {
					await Usuario.create({
						dni: "77777777I",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "test4@mail.com",
						password: "Pass123",
						rol: "GERENTE",
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("rol");
				}
			});

			it("rechaza contraseña incorrecta en autenticación", async () => {
				const usuario = await Usuario.create({
					dni: "88888888J",
					nombre: "Test Auth",
					apellidos: "Test",
					direccion: "Calle Test",
					telefono: "600000000",
					email: "test.auth@mail.com",
					password: "CorrectPass123",
					rol: "CLIENTE",
				});

				const resultado = await Usuario.autenticar(
					"test.auth@mail.com",
					"WrongPassword",
					"CLIENTE"
				);
				expect(resultado).to.be.null;

				await Usuario.findByIdAndDelete(usuario._id);
			});
		});

		describe("Factura - Validaciones", () => {
			it("rechaza factura sin número", async () => {
				try {
					await Factura.create({
						fecha: new Date(),
						clienteId: "507f1f77bcf86cd799439011",
						items: [],
						total: 100,
						envio: {
							nombre: "Test",
							direccion: "Test",
							ciudad: "Test",
							cp: "00000",
							telefono: "600000000",
						},
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("numero");
				}
			});

			it("rechaza factura con total negativo", async () => {
				try {
					await Factura.create({
						numero: "FAC-ERROR-001",
						fecha: new Date(),
						clienteId: "507f1f77bcf86cd799439011",
						items: [],
						total: -50,
						envio: {
							nombre: "Test",
							direccion: "Test",
							ciudad: "Test",
							cp: "00000",
							telefono: "600000000",
						},
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("total");
				}
			});

			it("rechaza factura sin datos de envío completos", async () => {
				try {
					await Factura.create({
						numero: "FAC-ERROR-002",
						fecha: new Date(),
						clienteId: "507f1f77bcf86cd799439011",
						items: [],
						total: 100,
						envio: {
							nombre: "Test",
						},
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.errors).to.exist;
				}
			});
		});

		describe("Carro - Validaciones", () => {
			it("rechaza cantidad menor a 1 en items", async () => {
				try {
					await Carro.create({
						clienteId: "507f1f77bcf86cd799439011",
						items: [{ libroId: "507f1f77bcf86cd799439012", cantidad: 0 }],
					});
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("cantidad");
				}
			});

			it("rechaza actualizar item con índice inválido", async () => {
				const carro = await Carro.create({
					clienteId: "507f1f77bcf86cd799439013",
					items: [],
				});

				try {
					carro.actualizarItem(5, 2);
					throw new Error("Debería haber fallado");
				} catch (error) {
					expect(error.message).to.include("Índice");
				}

				await Carro.findByIdAndDelete(carro._id);
			});
		});
	});

	describe("Agregar, Modificar y Eliminar", () => {
		describe("Libro - CRUD completo", () => {
			it("agrega un libro y verifica todos sus atributos", async () => {
				const datosLibro = {
					titulo: "Nuevo Libro CRUD",
					autor: "Autor CRUD",
					isbn: "978-84-1111-001-1",
					precio: 29.99,
					stock: 25,
				};

				const libro = await Libro.create(datosLibro);
				const libroJSON = libro.toJSON();

				expect(libroJSON.id).to.be.a("string").with.lengthOf(24);
				expect(libroJSON.titulo).to.equal(datosLibro.titulo);
				expect(libroJSON.autor).to.equal(datosLibro.autor);
				expect(libroJSON.isbn).to.equal(datosLibro.isbn);
				expect(libroJSON.precio).to.equal(datosLibro.precio);
				expect(libroJSON.stock).to.equal(datosLibro.stock);

				await Libro.findByIdAndDelete(libro._id);
			});

			it("modifica un libro y verifica todos los atributos actualizados", async () => {
				const libro = await Libro.create({
					titulo: "Libro Original",
					autor: "Autor Original",
					isbn: "978-84-1111-002-2",
					precio: 10.0,
					stock: 10,
				});

				const actualizaciones = {
					titulo: "Libro Modificado",
					autor: "Autor Modificado",
					precio: 35.5,
					stock: 100,
				};

				const libroActualizado = await Libro.findByIdAndUpdate(
					libro._id,
					actualizaciones,
					{ new: true }
				);
				const libroJSON = libroActualizado.toJSON();

				expect(libroJSON.id).to.equal(libro._id.toString());
				expect(libroJSON.titulo).to.equal(actualizaciones.titulo);
				expect(libroJSON.autor).to.equal(actualizaciones.autor);
				expect(libroJSON.isbn).to.equal("978-84-1111-002-2");
				expect(libroJSON.precio).to.equal(actualizaciones.precio);
				expect(libroJSON.stock).to.equal(actualizaciones.stock);

				await Libro.findByIdAndDelete(libro._id);
			});

			it("elimina un libro y verifica que no existe", async () => {
				const libro = await Libro.create({
					titulo: "Libro a Eliminar",
					autor: "Autor",
					isbn: "978-84-1111-003-3",
					precio: 10.0,
					stock: 5,
				});

				const libroId = libro._id;
				await Libro.findByIdAndDelete(libroId);

				const libroEliminado = await Libro.findById(libroId);
				expect(libroEliminado).to.be.null;
			});

			it("busca libro por ISBN y verifica todos los atributos", async () => {
				const datosLibro = {
					titulo: "Libro ISBN Search",
					autor: "Autor Search",
					isbn: "978-84-2222-001-1",
					precio: 22.0,
					stock: 15,
				};

				await Libro.create(datosLibro);
				const libro = await Libro.buscarPorIsbn(datosLibro.isbn);
				const libroJSON = libro.toJSON();

				expect(libroJSON.titulo).to.equal(datosLibro.titulo);
				expect(libroJSON.autor).to.equal(datosLibro.autor);
				expect(libroJSON.isbn).to.equal(datosLibro.isbn);
				expect(libroJSON.precio).to.equal(datosLibro.precio);
				expect(libroJSON.stock).to.equal(datosLibro.stock);

				await Libro.findByIdAndDelete(libro._id);
			});

			it("busca libros por rango de precio y verifica atributos", async () => {
				const libro1 = await Libro.create({
					titulo: "Libro Barato",
					autor: "Autor",
					isbn: "978-84-3333-001-1",
					precio: 5.0,
					stock: 10,
				});
				const libro2 = await Libro.create({
					titulo: "Libro Caro",
					autor: "Autor",
					isbn: "978-84-3333-002-2",
					precio: 50.0,
					stock: 10,
				});

				const librosEnRango = await Libro.buscarPorRangoPrecio(1, 10);
				expect(librosEnRango).to.be.an("array");
				const encontrado = librosEnRango.find(
					(l) => l.isbn === "978-84-3333-001-1"
				);
				expect(encontrado).to.exist;
				expect(encontrado.titulo).to.equal("Libro Barato");
				expect(encontrado.precio).to.equal(5.0);

				await Libro.findByIdAndDelete(libro1._id);
				await Libro.findByIdAndDelete(libro2._id);
			});
		});

		describe("Usuario - CRUD completo", () => {
			it("agrega un usuario cliente y verifica todos sus atributos", async () => {
				const datosUsuario = {
					dni: "99999999K",
					nombre: "Nuevo",
					apellidos: "Usuario CRUD",
					direccion: "Calle CRUD 123",
					telefono: "699888777",
					email: "nuevo.crud@mail.com",
					password: "CrudPass123",
					rol: "CLIENTE",
				};

				const usuario = await Usuario.create(datosUsuario);
				const usuarioJSON = usuario.toJSON();

				expect(usuarioJSON.id).to.be.a("string").with.lengthOf(24);
				expect(usuarioJSON.dni).to.equal(datosUsuario.dni);
				expect(usuarioJSON.nombre).to.equal(datosUsuario.nombre);
				expect(usuarioJSON.apellidos).to.equal(datosUsuario.apellidos);
				expect(usuarioJSON.direccion).to.equal(datosUsuario.direccion);
				expect(usuarioJSON.telefono).to.equal(datosUsuario.telefono);
				expect(usuarioJSON.email).to.equal(datosUsuario.email.toLowerCase());
				expect(usuarioJSON.rol).to.equal(datosUsuario.rol);

				await Usuario.findByIdAndDelete(usuario._id);
			});

			it("modifica un usuario y verifica todos los atributos actualizados", async () => {
				const usuario = await Usuario.create({
					dni: "10101010L",
					nombre: "Original",
					apellidos: "Usuario",
					direccion: "Calle Original",
					telefono: "600100100",
					email: "original@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});

				const actualizaciones = {
					nombre: "Modificado",
					apellidos: "Usuario Actualizado",
					direccion: "Nueva Dirección 456",
					telefono: "699111222",
				};

				const usuarioActualizado = await Usuario.findByIdAndUpdate(
					usuario._id,
					actualizaciones,
					{ new: true }
				);
				const usuarioJSON = usuarioActualizado.toJSON();

				expect(usuarioJSON.id).to.equal(usuario._id.toString());
				expect(usuarioJSON.dni).to.equal("10101010L");
				expect(usuarioJSON.nombre).to.equal(actualizaciones.nombre);
				expect(usuarioJSON.apellidos).to.equal(actualizaciones.apellidos);
				expect(usuarioJSON.direccion).to.equal(actualizaciones.direccion);
				expect(usuarioJSON.telefono).to.equal(actualizaciones.telefono);
				expect(usuarioJSON.email).to.equal("original@mail.com");
				expect(usuarioJSON.rol).to.equal("CLIENTE");

				await Usuario.findByIdAndDelete(usuario._id);
			});

			it("elimina un usuario y verifica que no existe", async () => {
				const usuario = await Usuario.create({
					dni: "20202020M",
					nombre: "A Eliminar",
					apellidos: "Usuario",
					direccion: "Calle Delete",
					telefono: "600200200",
					email: "eliminar@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});

				const usuarioId = usuario._id;
				await Usuario.findByIdAndDelete(usuarioId);

				const usuarioEliminado = await Usuario.findById(usuarioId);
				expect(usuarioEliminado).to.be.null;
			});

			it("busca usuario por email y verifica atributos", async () => {
				const datosUsuario = {
					dni: "30303030N",
					nombre: "Búsqueda",
					apellidos: "Email Test",
					direccion: "Calle Search",
					telefono: "600300300",
					email: "busqueda.email@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				};

				await Usuario.create(datosUsuario);
				const usuario = await Usuario.buscarPorEmail(
					datosUsuario.email,
					"CLIENTE"
				);
				const usuarioJSON = usuario.toJSON();

				expect(usuarioJSON.dni).to.equal(datosUsuario.dni);
				expect(usuarioJSON.nombre).to.equal(datosUsuario.nombre);
				expect(usuarioJSON.apellidos).to.equal(datosUsuario.apellidos);
				expect(usuarioJSON.email).to.equal(datosUsuario.email.toLowerCase());

				await Usuario.findByIdAndDelete(usuario._id);
			});

			it("autentica usuario correctamente y verifica atributos", async () => {
				const datosUsuario = {
					dni: "40404040O",
					nombre: "Auth",
					apellidos: "Test User",
					direccion: "Calle Auth",
					telefono: "600400400",
					email: "auth.test.model@mail.com",
					password: "AuthPass123",
					rol: "CLIENTE",
				};

				await Usuario.create(datosUsuario);
				const usuario = await Usuario.autenticar(
					datosUsuario.email,
					datosUsuario.password,
					"CLIENTE"
				);

				expect(usuario).to.not.be.null;
				expect(usuario.dni).to.equal(datosUsuario.dni);
				expect(usuario.nombre).to.equal(datosUsuario.nombre);
				expect(usuario.email).to.equal(datosUsuario.email.toLowerCase());

				await Usuario.findByIdAndDelete(usuario._id);
			});
		});

		describe("Carro - CRUD completo", () => {
			let clienteId;
			let libroId1;
			let libroId2;

			before(async () => {
				const cliente = await Usuario.create({
					dni: "50505050P",
					nombre: "Cliente",
					apellidos: "Carro CRUD",
					direccion: "Calle Carro CRUD",
					telefono: "600500500",
					email: "cliente.carro.crud@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});
				clienteId = cliente._id;

				const libro1 = await Libro.create({
					titulo: "Libro Carro 1",
					autor: "Autor",
					isbn: "978-84-4444-001-1",
					precio: 10.0,
					stock: 50,
				});
				libroId1 = libro1._id;

				const libro2 = await Libro.create({
					titulo: "Libro Carro 2",
					autor: "Autor",
					isbn: "978-84-4444-002-2",
					precio: 20.0,
					stock: 50,
				});
				libroId2 = libro2._id;
			});

			after(async () => {
				await Carro.deleteMany({});
				await Usuario.findByIdAndDelete(clienteId);
				await Libro.findByIdAndDelete(libroId1);
				await Libro.findByIdAndDelete(libroId2);
			});

			it("crea carro y agrega item verificando todos los atributos", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [],
				});

				await carro.agregarItem(libroId1, 3);
				const carroActualizado = await Carro.findById(carro._id);
				const carroJSON = carroActualizado.toJSON();

				expect(carroJSON.id).to.be.a("string").with.lengthOf(24);
				expect(carroJSON.clienteId).to.equal(clienteId.toString());
				expect(carroJSON.items).to.have.lengthOf(1);
				expect(carroJSON.items[0].libroId).to.equal(libroId1.toString());
				expect(carroJSON.items[0].cantidad).to.equal(3);

				await Carro.findByIdAndDelete(carro._id);
			});

			it("agrega múltiples items al carro y verifica", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [],
				});

				await carro.agregarItem(libroId1, 2);
				await carro.agregarItem(libroId2, 4);

				const carroActualizado = await Carro.findById(carro._id);
				const carroJSON = carroActualizado.toJSON();

				expect(carroJSON.items).to.have.lengthOf(2);

				const item1 = carroJSON.items.find(
					(i) => i.libroId === libroId1.toString()
				);
				const item2 = carroJSON.items.find(
					(i) => i.libroId === libroId2.toString()
				);

				expect(item1.cantidad).to.equal(2);
				expect(item2.cantidad).to.equal(4);

				await Carro.findByIdAndDelete(carro._id);
			});

			it("actualiza cantidad de item existente", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [{ libroId: libroId1, cantidad: 2 }],
				});

				await carro.actualizarItem(0, 10);
				const carroActualizado = await Carro.findById(carro._id);
				const carroJSON = carroActualizado.toJSON();

				expect(carroJSON.items[0].cantidad).to.equal(10);

				await Carro.findByIdAndDelete(carro._id);
			});

			it("elimina item del carro al poner cantidad 0", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [
						{ libroId: libroId1, cantidad: 2 },
						{ libroId: libroId2, cantidad: 3 },
					],
				});

				await carro.actualizarItem(0, 0);
				const carroActualizado = await Carro.findById(carro._id);
				const carroJSON = carroActualizado.toJSON();

				expect(carroJSON.items).to.have.lengthOf(1);
				expect(carroJSON.items[0].libroId).to.equal(libroId2.toString());

				await Carro.findByIdAndDelete(carro._id);
			});

			it("vacía el carro completamente", async () => {
				const carro = await Carro.create({
					clienteId: clienteId,
					items: [
						{ libroId: libroId1, cantidad: 2 },
						{ libroId: libroId2, cantidad: 3 },
					],
				});

				await carro.vaciar();
				const carroActualizado = await Carro.findById(carro._id);
				const carroJSON = carroActualizado.toJSON();

				expect(carroJSON.items).to.have.lengthOf(0);

				await Carro.findByIdAndDelete(carro._id);
			});
		});

		describe("Factura - CRUD completo", () => {
			let clienteId;
			let libroId;

			before(async () => {
				const cliente = await Usuario.create({
					dni: "60606060Q",
					nombre: "Cliente",
					apellidos: "Factura CRUD",
					direccion: "Calle Factura CRUD",
					telefono: "600600600",
					email: "cliente.factura.crud@mail.com",
					password: "Pass123",
					rol: "CLIENTE",
				});
				clienteId = cliente._id;

				const libro = await Libro.create({
					titulo: "Libro Factura CRUD",
					autor: "Autor",
					isbn: "978-84-5555-001-1",
					precio: 25.0,
					stock: 100,
				});
				libroId = libro._id;
			});

			after(async () => {
				await Factura.deleteMany({});
				await Usuario.findByIdAndDelete(clienteId);
				await Libro.findByIdAndDelete(libroId);
			});

			it("crea factura y verifica todos los atributos", async () => {
				const datosFactura = {
					numero: "FAC-CRUD-001",
					fecha: new Date("2025-12-08T12:00:00Z"),
					clienteId: clienteId,
					items: [{ libroId: libroId, cantidad: 4 }],
					total: 100.0,
					envio: {
						nombre: "Cliente CRUD",
						direccion: "Calle Envío CRUD",
						ciudad: "Barcelona",
						cp: "08001",
						telefono: "600666777",
					},
				};

				const factura = await Factura.create(datosFactura);
				const facturaJSON = factura.toJSON();

				expect(facturaJSON.id).to.be.a("string").with.lengthOf(24);
				expect(facturaJSON.numero).to.equal(datosFactura.numero);
				expect(facturaJSON.clienteId).to.equal(clienteId.toString());
				expect(facturaJSON.total).to.equal(datosFactura.total);
				expect(facturaJSON.items).to.have.lengthOf(1);
				expect(facturaJSON.items[0].libroId).to.equal(libroId.toString());
				expect(facturaJSON.items[0].cantidad).to.equal(4);
				expect(facturaJSON.envio.nombre).to.equal(datosFactura.envio.nombre);
				expect(facturaJSON.envio.direccion).to.equal(
					datosFactura.envio.direccion
				);
				expect(facturaJSON.envio.ciudad).to.equal(datosFactura.envio.ciudad);
				expect(facturaJSON.envio.cp).to.equal(datosFactura.envio.cp);
				expect(facturaJSON.envio.telefono).to.equal(
					datosFactura.envio.telefono
				);

				await Factura.findByIdAndDelete(factura._id);
			});

			it("busca factura por número y verifica atributos", async () => {
				const factura = await Factura.create({
					numero: "FAC-SEARCH-001",
					fecha: new Date(),
					clienteId: clienteId,
					items: [{ libroId: libroId, cantidad: 2 }],
					total: 50.0,
					envio: {
						nombre: "Test",
						direccion: "Test Dir",
						ciudad: "Madrid",
						cp: "28001",
						telefono: "600000000",
					},
				});

				const facturaEncontrada = await Factura.buscarPorNumero(
					"FAC-SEARCH-001"
				);
				const facturaJSON = facturaEncontrada.toJSON();

				expect(facturaJSON.numero).to.equal("FAC-SEARCH-001");
				expect(facturaJSON.clienteId).to.equal(clienteId.toString());
				expect(facturaJSON.total).to.equal(50.0);

				await Factura.findByIdAndDelete(factura._id);
			});

			it("busca facturas por cliente y verifica atributos", async () => {
				const factura1 = await Factura.create({
					numero: "FAC-CLIENT-001",
					fecha: new Date(),
					clienteId: clienteId,
					items: [],
					total: 30.0,
					envio: {
						nombre: "Test",
						direccion: "Test",
						ciudad: "Test",
						cp: "00000",
						telefono: "600000000",
					},
				});

				const factura2 = await Factura.create({
					numero: "FAC-CLIENT-002",
					fecha: new Date(),
					clienteId: clienteId,
					items: [],
					total: 45.0,
					envio: {
						nombre: "Test",
						direccion: "Test",
						ciudad: "Test",
						cp: "00000",
						telefono: "600000000",
					},
				});

				const facturas = await Factura.buscarPorCliente(clienteId);
				expect(facturas).to.be.an("array");
				expect(facturas.length).to.be.at.least(2);

				const numeros = facturas.map((f) => f.numero);
				expect(numeros).to.include("FAC-CLIENT-001");
				expect(numeros).to.include("FAC-CLIENT-002");

				await Factura.findByIdAndDelete(factura1._id);
				await Factura.findByIdAndDelete(factura2._id);
			});
		});
	});

	describe("Cálculos", () => {
		let clienteId;
		let libro1, libro2, libro3;

		before(async () => {
			await db.reiniciar();

			const cliente = await Usuario.create({
				dni: "70707070R",
				nombre: "Cliente",
				apellidos: "Cálculos Test",
				direccion: "Calle Cálculos",
				telefono: "600700700",
				email: "cliente.calculos@mail.com",
				password: "Pass123",
				rol: "CLIENTE",
			});
			clienteId = cliente._id;

			libro1 = await Libro.create({
				titulo: "Libro Calc 1",
				autor: "Autor",
				isbn: "978-84-6666-001-1",
				precio: 15.95,
				stock: 100,
			});

			libro2 = await Libro.create({
				titulo: "Libro Calc 2",
				autor: "Autor",
				isbn: "978-84-6666-002-2",
				precio: 18.9,
				stock: 50,
			});

			libro3 = await Libro.create({
				titulo: "Libro Calc 3",
				autor: "Autor",
				isbn: "978-84-6666-003-3",
				precio: 25.0,
				stock: 30,
			});
		});

		after(async () => {
			await Factura.deleteMany({});
			await Carro.deleteMany({});
			await Usuario.findByIdAndDelete(clienteId);
			await Libro.findByIdAndDelete(libro1._id);
			await Libro.findByIdAndDelete(libro2._id);
			await Libro.findByIdAndDelete(libro3._id);
		});

		it("calcula total de compra con un solo item", async () => {
			const cantidad = 3;
			const totalEsperado = libro1.precio * cantidad;

			const factura = await Factura.create({
				numero: "FAC-CALC-001",
				fecha: new Date(),
				clienteId: clienteId,
				items: [{ libroId: libro1._id, cantidad: cantidad }],
				total: totalEsperado,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			const facturaJSON = factura.toJSON();
			expect(facturaJSON.id).to.be.a("string").with.lengthOf(24);
			expect(facturaJSON.numero).to.equal("FAC-CALC-001");
			expect(facturaJSON.fecha).to.be.a("string");
			expect(facturaJSON.clienteId).to.equal(clienteId.toString());
			expect(facturaJSON.total).to.be.closeTo(47.85, 0.01);

			expect(facturaJSON.items).to.be.an("array").with.lengthOf(1);
			expect(facturaJSON.items[0].libroId).to.equal(libro1._id.toString());
			expect(facturaJSON.items[0].cantidad).to.equal(cantidad);

			expect(facturaJSON.envio).to.be.an("object");
			expect(facturaJSON.envio.nombre).to.equal("Test");
			expect(facturaJSON.envio.direccion).to.equal("Test");
			expect(facturaJSON.envio.ciudad).to.equal("Test");
			expect(facturaJSON.envio.cp).to.equal("00000");
			expect(facturaJSON.envio.telefono).to.equal("600000000");

			await Factura.findByIdAndDelete(factura._id);
		});

		it("calcula total de compra con múltiples items", async () => {
			const totalEsperado = 15.95 * 2 + 18.9 * 3;

			const factura = await Factura.create({
				numero: "FAC-CALC-002",
				fecha: new Date(),
				clienteId: clienteId,
				items: [
					{ libroId: libro1._id, cantidad: 2 },
					{ libroId: libro2._id, cantidad: 3 },
				],
				total: totalEsperado,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			const facturaJSON = factura.toJSON();
			expect(facturaJSON.id).to.be.a("string").with.lengthOf(24);
			expect(facturaJSON.numero).to.equal("FAC-CALC-002");
			expect(facturaJSON.fecha).to.be.a("string");
			expect(facturaJSON.clienteId).to.equal(clienteId.toString());
			expect(facturaJSON.total).to.be.closeTo(88.6, 0.01);

			expect(facturaJSON.items).to.be.an("array").with.lengthOf(2);
			expect(facturaJSON.items[0].libroId).to.equal(libro1._id.toString());
			expect(facturaJSON.items[0].cantidad).to.equal(2);
			expect(facturaJSON.items[1].libroId).to.equal(libro2._id.toString());
			expect(facturaJSON.items[1].cantidad).to.equal(3);

			expect(facturaJSON.envio).to.be.an("object");
			expect(facturaJSON.envio.nombre).to.equal("Test");
			expect(facturaJSON.envio.direccion).to.equal("Test");
			expect(facturaJSON.envio.ciudad).to.equal("Test");
			expect(facturaJSON.envio.cp).to.equal("00000");
			expect(facturaJSON.envio.telefono).to.equal("600000000");

			await Factura.findByIdAndDelete(factura._id);
		});

		it("calcula total de compra con todos los libros", async () => {
			const totalEsperado = 15.95 * 1 + 18.9 * 2 + 25.0 * 1;

			const factura = await Factura.create({
				numero: "FAC-CALC-003",
				fecha: new Date(),
				clienteId: clienteId,
				items: [
					{ libroId: libro1._id, cantidad: 1 },
					{ libroId: libro2._id, cantidad: 2 },
					{ libroId: libro3._id, cantidad: 1 },
				],
				total: totalEsperado,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			const facturaJSON = factura.toJSON();
			expect(facturaJSON.id).to.be.a("string").with.lengthOf(24);
			expect(facturaJSON.numero).to.equal("FAC-CALC-003");
			expect(facturaJSON.fecha).to.be.a("string");
			expect(facturaJSON.clienteId).to.equal(clienteId.toString());
			expect(facturaJSON.total).to.be.closeTo(78.75, 0.01);

			expect(facturaJSON.items).to.be.an("array").with.lengthOf(3);
			expect(facturaJSON.items[0].libroId).to.equal(libro1._id.toString());
			expect(facturaJSON.items[0].cantidad).to.equal(1);
			expect(facturaJSON.items[1].libroId).to.equal(libro2._id.toString());
			expect(facturaJSON.items[1].cantidad).to.equal(2);
			expect(facturaJSON.items[2].libroId).to.equal(libro3._id.toString());
			expect(facturaJSON.items[2].cantidad).to.equal(1);

			expect(facturaJSON.envio).to.be.an("object");
			expect(facturaJSON.envio.nombre).to.equal("Test");
			expect(facturaJSON.envio.direccion).to.equal("Test");
			expect(facturaJSON.envio.ciudad).to.equal("Test");
			expect(facturaJSON.envio.cp).to.equal("00000");
			expect(facturaJSON.envio.telefono).to.equal("600000000");

			await Factura.findByIdAndDelete(factura._id);
		});

		it("reduce stock correctamente tras una compra", async () => {
			const stockInicial = libro1.stock;
			const cantidadCompra = 5;

			await libro1.reducirStock(cantidadCompra);
			const libroActualizado = await Libro.findById(libro1._id);

			expect(libroActualizado.stock).to.equal(stockInicial - cantidadCompra);

			libroActualizado.stock = stockInicial;
			await libroActualizado.save();
		});

		it("reduce stock de múltiples libros correctamente", async () => {
			const stock1Inicial = libro1.stock;
			const stock2Inicial = libro2.stock;

			await libro1.reducirStock(3);
			await libro2.reducirStock(7);

			const libro1Actualizado = await Libro.findById(libro1._id);
			const libro2Actualizado = await Libro.findById(libro2._id);

			expect(libro1Actualizado.stock).to.equal(stock1Inicial - 3);
			expect(libro2Actualizado.stock).to.equal(stock2Inicial - 7);

			libro1Actualizado.stock = stock1Inicial;
			libro2Actualizado.stock = stock2Inicial;
			await libro1Actualizado.save();
			await libro2Actualizado.save();
		});

		it("verifica que no permite compra si stock insuficiente", async () => {
			const libro = await Libro.findById(libro3._id);
			const stockActual = libro.stock;

			try {
				await libro.reducirStock(stockActual + 10);
				throw new Error("Debería haber fallado");
			} catch (error) {
				expect(error.message).to.include("Stock insuficiente");
			}

			const libroVerificado = await Libro.findById(libro3._id);
			expect(libroVerificado.stock).to.equal(stockActual);
		});

		it("calcula correctamente precio con decimales", async () => {
			const precioUnitario = 19.99;
			const cantidad = 7;
			const totalEsperado = precioUnitario * cantidad;

			const libroDecimal = await Libro.create({
				titulo: "Libro Decimal",
				autor: "Autor",
				isbn: "978-84-7777-001-1",
				precio: precioUnitario,
				stock: 20,
			});

			const factura = await Factura.create({
				numero: "FAC-DECIMAL-001",
				fecha: new Date(),
				clienteId: clienteId,
				items: [{ libroId: libroDecimal._id, cantidad: cantidad }],
				total: totalEsperado,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			expect(factura.total).to.be.closeTo(139.93, 0.01);

			await Factura.findByIdAndDelete(factura._id);
			await Libro.findByIdAndDelete(libroDecimal._id);
		});

		it("verifica número de factura secuencial", async () => {
			await Factura.deleteMany({});

			const numero1 = await Factura.generarNumeroFactura();
			expect(numero1).to.equal("FAC-0001");

			await Factura.create({
				numero: numero1,
				fecha: new Date(),
				clienteId: clienteId,
				items: [],
				total: 0,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			const numero2 = await Factura.generarNumeroFactura();
			expect(numero2).to.equal("FAC-0002");

			await Factura.create({
				numero: numero2,
				fecha: new Date(),
				clienteId: clienteId,
				items: [],
				total: 0,
				envio: {
					nombre: "Test",
					direccion: "Test",
					ciudad: "Test",
					cp: "00000",
					telefono: "600000000",
				},
			});

			const numero3 = await Factura.generarNumeroFactura();
			expect(numero3).to.equal("FAC-0003");
		});

		it("agregar item existente al carro suma cantidades", async () => {
			const carro = await Carro.create({
				clienteId: clienteId,
				items: [{ libroId: libro1._id, cantidad: 2 }],
			});

			await carro.agregarItem(libro1._id, 3);
			const carroActualizado = await Carro.findById(carro._id);

			expect(carroActualizado.items).to.have.lengthOf(1);
			expect(carroActualizado.items[0].cantidad).to.equal(5);

			await Carro.findByIdAndDelete(carro._id);
		});

		it("verifica cálculo de items en carro para total", async () => {
			const carro = await Carro.create({
				clienteId: clienteId,
				items: [
					{ libroId: libro1._id, cantidad: 2 },
					{ libroId: libro2._id, cantidad: 1 },
				],
			});

			const carroPopulado = await Carro.findById(carro._id).populate(
				"items.libroId"
			);

			let totalCalculado = 0;
			for (const item of carroPopulado.items) {
				totalCalculado += item.libroId.precio * item.cantidad;
			}

			expect(totalCalculado).to.be.closeTo(50.8, 0.01);

			await Carro.findByIdAndDelete(carro._id);
		});

		it("verifica stock después de múltiples operaciones", async () => {
			const libroTest = await Libro.create({
				titulo: "Libro Multi Ops",
				autor: "Autor",
				isbn: "978-84-8888-001-1",
				precio: 10.0,
				stock: 100,
			});

			await libroTest.reducirStock(10);
			let libroActualizado = await Libro.findById(libroTest._id);
			expect(libroActualizado.stock).to.equal(90);

			await libroActualizado.reducirStock(25);
			libroActualizado = await Libro.findById(libroTest._id);
			expect(libroActualizado.stock).to.equal(65);

			await libroActualizado.actualizarStock(50);
			libroActualizado = await Libro.findById(libroTest._id);
			expect(libroActualizado.stock).to.equal(50);

			await Libro.findByIdAndDelete(libroTest._id);
		});
	});
});
