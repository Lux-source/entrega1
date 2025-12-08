import chai from "chai";
import chaiHttp from "chai-http";
import app from "../app.mjs";
import { db } from "../server/data/db-context.mjs";
import { conectarDB, desconectarDB } from "../server/config/database.mjs";

chai.use(chaiHttp);
const expect = chai.expect;

describe("PRUEBAS REST API", () => {
	before(async function () {
		this.timeout(10000);
		await conectarDB();
		await db.reiniciar();
		console.log("DB Reiniciada para tests REST.");
	});

	after(async () => {
		await db.reiniciar();
		await desconectarDB();
	});

	describe("Getters y Setters", () => {
		describe("Libros - GET", () => {
			it("GET /api/libros - Devuelve todos los libros con todos sus atributos", (done) => {
				chai
					.request(app)
					.get("/api/libros")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.be.at.least(1);
						const libro = res.body[0];
						expect(libro.id).to.be.a("string").with.lengthOf(24);
						expect(libro.titulo).to.be.a("string");
						expect(libro.autor).to.be.a("string");
						expect(libro.isbn).to.be.a("string");
						expect(libro.precio).to.be.a("number");
						expect(libro.stock).to.be.a("number");
						done();
					});
			});

			it("GET /api/libros/:id - Devuelve un libro específico con todos sus atributos", (done) => {
				chai
					.request(app)
					.get("/api/libros")
					.end((err, res) => {
						const primerLibro = res.body[0];
						chai
							.request(app)
							.get(`/api/libros/${primerLibro.id}`)
							.end((err, res) => {
								expect(res).to.have.status(200);

								expect(res.body.id).to.equal(primerLibro.id);
								expect(res.body.id).to.be.a("string").with.lengthOf(24);
								expect(res.body.titulo).to.equal(primerLibro.titulo);
								expect(res.body.autor).to.equal(primerLibro.autor);
								expect(res.body.isbn).to.equal(primerLibro.isbn);
								expect(res.body.precio).to.equal(primerLibro.precio);
								expect(res.body.stock).to.equal(primerLibro.stock);
								done();
							});
					});
			});

			it("GET /api/libros?min=10&max=20 - Filtra libros por precio y verifica atributos", (done) => {
				chai
					.request(app)
					.get("/api/libros?min=10&max=20")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");

						res.body.forEach((libro) => {
							expect(libro.id).to.be.a("string").with.lengthOf(24);
							expect(libro.titulo).to.be.a("string");
							expect(libro.autor).to.be.a("string");
							expect(libro.isbn).to.be.a("string");
							expect(libro.precio).to.be.at.least(10);
							expect(libro.precio).to.be.at.most(20);
							expect(libro.stock).to.be.a("number");
						});
						done();
					});
			});

			it("GET /api/libros?isbn=978-84-376-0494-7 - Filtra por ISBN y verifica atributos", (done) => {
				chai
					.request(app)
					.get("/api/libros?isbn=978-84-376-0494-7")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("object");
						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.titulo).to.be.a("string");
						expect(res.body.autor).to.be.a("string");
						expect(res.body.isbn).to.equal("978-84-376-0494-7");
						expect(res.body.precio).to.be.a("number");
						expect(res.body.stock).to.be.a("number");
						done();
					});
			});
		});

		describe("Usuarios - GET", () => {
			it("GET /api/clientes - Devuelve todos los clientes con todos sus atributos", (done) => {
				chai
					.request(app)
					.get("/api/clientes")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.be.at.least(1);

						const cliente = res.body[0];
						expect(cliente.id).to.be.a("string").with.lengthOf(24);
						expect(cliente.dni).to.be.a("string");
						expect(cliente.nombre).to.be.a("string");
						expect(cliente.apellidos).to.be.a("string");
						expect(cliente.direccion).to.be.a("string");
						expect(cliente.telefono).to.be.a("string");
						expect(cliente.email).to.be.a("string");
						expect(cliente.rol).to.equal("CLIENTE");
						expect(cliente.password).to.be.undefined;
						done();
					});
			});

			it("GET /api/admins - Devuelve todos los admins con todos sus atributos", (done) => {
				chai
					.request(app)
					.get("/api/admins")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.be.at.least(1);

						const admin = res.body[0];
						expect(admin.id).to.be.a("string").with.lengthOf(24);
						expect(admin.dni).to.be.a("string");
						expect(admin.nombre).to.be.a("string");
						expect(admin.apellidos).to.be.a("string");
						expect(admin.direccion).to.be.a("string");
						expect(admin.telefono).to.be.a("string");
						expect(admin.email).to.be.a("string");
						expect(admin.rol).to.equal("ADMIN");
						expect(admin.password).to.be.undefined;
						done();
					});
			});
		});

		describe("Facturas - GET", () => {
			let facturaId;
			let clienteId;
			let libroId;

			before(async function () {
				const loginRes = await chai
					.request(app)
					.post("/api/clientes/autenticar")
					.send({ email: "juan@mail.com", password: "Juanperez123" });
				clienteId = loginRes.body.id;

				const librosRes = await chai.request(app).get("/api/libros");
				libroId = librosRes.body[0].id;

				const compraRes = await chai
					.request(app)
					.post("/api/compras")
					.send({
						clienteId: clienteId,
						items: [{ libroId: libroId, cantidad: 1 }],
						envio: {
							nombre: "Test",
							direccion: "Test Dir",
							ciudad: "Madrid",
							cp: "28001",
							telefono: "600000000",
						},
					});
				facturaId = compraRes.body.id;
			});

			it("GET /api/facturas/:id - Devuelve factura con todos sus atributos", (done) => {
				chai
					.request(app)
					.get(`/api/facturas/${facturaId}`)
					.end((err, res) => {
						expect(res).to.have.status(200);

						expect(res.body.id).to.equal(facturaId);
						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.numero).to.be.a("string");
						expect(res.body.fecha).to.be.a("string");
						expect(res.body.clienteId).to.equal(clienteId);
						expect(res.body.total).to.be.a("number");
						expect(res.body.items).to.be.an("array");

						if (res.body.items.length > 0) {
							const item = res.body.items[0];
							expect(item.libroId).to.be.a("string");
							expect(item.cantidad).to.be.a("number");
						}

						expect(res.body.envio).to.be.an("object");
						expect(res.body.envio.nombre).to.be.a("string");
						expect(res.body.envio.direccion).to.be.a("string");
						expect(res.body.envio.ciudad).to.be.a("string");
						expect(res.body.envio.cp).to.be.a("string");
						expect(res.body.envio.telefono).to.be.a("string");
						done();
					});
			});

			it("GET /api/compras - Devuelve lista de compras con atributos", (done) => {
				chai
					.request(app)
					.get("/api/compras")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");

						const factura = res.body.find((f) => f.id === facturaId);
						expect(factura, "factura creada debe existir en listado").to.exist;
						expect(factura.id).to.equal(facturaId);
						expect(factura.numero).to.be.a("string");
						expect(factura.fecha).to.be.a("string");
						expect(factura.clienteId).to.equal(clienteId);
						expect(factura.total).to.be.a("number").and.to.be.above(0);

						expect(factura.items).to.be.an("array").with.lengthOf(1);
						expect(factura.items[0].libroId).to.equal(libroId);
						expect(factura.items[0].cantidad).to.equal(1);

						expect(factura.envio).to.be.an("object");
						expect(factura.envio.nombre).to.equal("Test");
						expect(factura.envio.direccion).to.equal("Test Dir");
						expect(factura.envio.ciudad).to.equal("Madrid");
						expect(factura.envio.cp).to.equal("28001");
						expect(factura.envio.telefono).to.equal("600000000");
						done();
					});
			});
		});
	});

	describe("Excepciones", () => {
		describe("Libros - Errores", () => {
			it("GET /api/libros/:id - Devuelve 404 para libro inexistente", (done) => {
				chai
					.request(app)
					.get("/api/libros/507f1f77bcf86cd799999999")
					.end((err, res) => {
						expect(res).to.have.status(404);
						done();
					});
			});

			it("POST /api/libros - Rechaza libro sin título", (done) => {
				chai
					.request(app)
					.post("/api/libros")
					.send({
						autor: "Autor",
						isbn: "978-00-TEST-001",
						precio: 10,
						stock: 5,
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("POST /api/libros - Rechaza libro con precio negativo", (done) => {
				chai
					.request(app)
					.post("/api/libros")
					.send({
						titulo: "Test",
						autor: "Autor",
						isbn: "978-00-TEST-002",
						precio: -10,
						stock: 5,
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("POST /api/libros - Rechaza libro con stock negativo", (done) => {
				chai
					.request(app)
					.post("/api/libros")
					.send({
						titulo: "Test",
						autor: "Autor",
						isbn: "978-00-TEST-003",
						precio: 10,
						stock: -5,
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("DELETE /api/libros/:id - Devuelve 404 para libro inexistente", (done) => {
				chai
					.request(app)
					.delete("/api/libros/507f1f77bcf86cd799999999")
					.end((err, res) => {
						expect(res).to.have.status(404);
						done();
					});
			});
		});

		describe("Usuarios - Errores", () => {
			it("POST /api/clientes/autenticar - Rechaza credenciales incorrectas", (done) => {
				chai
					.request(app)
					.post("/api/clientes/autenticar")
					.send({ email: "juan@mail.com", password: "WRONG" })
					.end((err, res) => {
						expect(res).to.have.status(401);
						done();
					});
			});

			it("POST /api/admins/autenticar - Rechaza credenciales incorrectas", (done) => {
				chai
					.request(app)
					.post("/api/admins/autenticar")
					.send({ email: "admin@libreria.com", password: "WRONG" })
					.end((err, res) => {
						expect(res).to.have.status(401);
						done();
					});
			});

			it("POST /api/clientes - Rechaza DNI inválido", (done) => {
				chai
					.request(app)
					.post("/api/clientes")
					.send({
						dni: "1234",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "error.dni@mail.com",
						password: "Pass123",
						passwordConfirm: "Pass123",
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("POST /api/clientes - Rechaza email inválido", (done) => {
				chai
					.request(app)
					.post("/api/clientes")
					.send({
						dni: "99999999Z",
						nombre: "Test",
						apellidos: "Test",
						direccion: "Calle Test",
						telefono: "600000000",
						email: "no-es-email",
						password: "Pass123",
						passwordConfirm: "Pass123",
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("GET /api/clientes/:id - Devuelve 404 para cliente inexistente", (done) => {
				chai
					.request(app)
					.get("/api/clientes/507f1f77bcf86cd799999999")
					.end((err, res) => {
						expect(res).to.have.status(404);
						done();
					});
			});
		});

		describe("Compras - Errores", () => {
			it("POST /api/compras - Rechaza compra sin clienteId", (done) => {
				chai
					.request(app)
					.post("/api/compras")
					.send({
						items: [],
						envio: {
							nombre: "Test",
							direccion: "Test",
							ciudad: "Test",
							cp: "00000",
							telefono: "600000000",
						},
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("POST /api/compras - Rechaza compra sin items", (done) => {
				chai
					.request(app)
					.post("/api/compras")
					.send({
						clienteId: "507f1f77bcf86cd799439011",
						items: [],
						envio: {
							nombre: "Test",
							direccion: "Test",
							ciudad: "Test",
							cp: "00000",
							telefono: "600000000",
						},
					})
					.end((err, res) => {
						expect(res).to.have.status(400);
						done();
					});
			});

			it("GET /api/facturas/:id - Devuelve 404 para factura inexistente", (done) => {
				chai
					.request(app)
					.get("/api/facturas/507f1f77bcf86cd799999999")
					.end((err, res) => {
						expect(res).to.have.status(404);
						done();
					});
			});
		});

		describe("Carro - Errores", () => {
			it("GET /api/clientes/:id/carro - Devuelve array vacío para cliente inexistente", (done) => {
				chai
					.request(app)
					.get("/api/clientes/507f1f77bcf86cd799999999/carro")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.equal(0);
						done();
					});
			});

			it("POST /api/clientes/:id/carro/items - Rechaza cantidad inválida", async () => {
				const loginRes = await chai
					.request(app)
					.post("/api/clientes/autenticar")
					.send({ email: "juan@mail.com", password: "Juanperez123" });
				const clienteId = loginRes.body.id;

				const res = await chai
					.request(app)
					.post(`/api/clientes/${clienteId}/carro/items`)
					.send({ libroId: "507f1f77bcf86cd799439011", cantidad: 0 });

				expect(res).to.have.status(400);
			});
		});
	});

	describe("Agregar, Modificar y Eliminar", () => {
		describe("Libros - CRUD", () => {
			let libroCreadoId;

			it("POST /api/libros - Crea libro y verifica todos los atributos", (done) => {
				const nuevoLibro = {
					titulo: "Libro REST Test",
					autor: "Autor REST",
					isbn: "123-456-789-" + Date.now(),
					precio: 25.5,
					stock: 10,
				};

				chai
					.request(app)
					.post("/api/libros")
					.send(nuevoLibro)
					.end((err, res) => {
						expect(res).to.have.status(201);

						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.titulo).to.equal(nuevoLibro.titulo);
						expect(res.body.autor).to.equal(nuevoLibro.autor);
						expect(res.body.isbn).to.equal(nuevoLibro.isbn);
						expect(res.body.precio).to.equal(nuevoLibro.precio);
						expect(res.body.stock).to.equal(nuevoLibro.stock);

						libroCreadoId = res.body.id;
						done();
					});
			});

			it("PUT /api/libros/:id - Actualiza libro y verifica todos los atributos", (done) => {
				const actualizaciones = {
					titulo: "Libro REST Actualizado",
					precio: 30.0,
					stock: 15,
				};

				chai
					.request(app)
					.put(`/api/libros/${libroCreadoId}`)
					.send(actualizaciones)
					.end((err, res) => {
						expect(res).to.have.status(200);

						expect(res.body.id).to.equal(libroCreadoId);
						expect(res.body.titulo).to.equal(actualizaciones.titulo);
						expect(res.body.precio).to.equal(actualizaciones.precio);
						expect(res.body.stock).to.equal(actualizaciones.stock);
						expect(res.body.autor).to.be.a("string");
						expect(res.body.isbn).to.be.a("string");
						done();
					});
			});

			it("DELETE /api/libros/:id - Elimina libro correctamente", (done) => {
				chai
					.request(app)
					.delete(`/api/libros/${libroCreadoId}`)
					.end((err, res) => {
						expect(res).to.have.status(204);

						chai
							.request(app)
							.get(`/api/libros/${libroCreadoId}`)
							.end((err, res) => {
								expect(res).to.have.status(404);
								done();
							});
					});
			});

			it("PUT /api/libros - Reemplazo masivo de libros", (done) => {
				const nuevosLibros = [
					{
						titulo: "Bulk Libro 1",
						autor: "Bulk Author",
						isbn: "999-000-001",
						precio: 10,
						stock: 5,
					},
					{
						titulo: "Bulk Libro 2",
						autor: "Bulk Author",
						isbn: "999-000-002",
						precio: 20,
						stock: 5,
					},
				];

				chai
					.request(app)
					.put("/api/libros")
					.send(nuevosLibros)
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.equal(2);

						res.body.forEach((libro, index) => {
							expect(libro.id).to.be.a("string").with.lengthOf(24);
							expect(libro.titulo).to.equal(nuevosLibros[index].titulo);
							expect(libro.autor).to.equal(nuevosLibros[index].autor);
							expect(libro.isbn).to.equal(nuevosLibros[index].isbn);
							expect(libro.precio).to.equal(nuevosLibros[index].precio);
							expect(libro.stock).to.equal(nuevosLibros[index].stock);
						});
						done();
					});
			});

			it("DELETE /api/libros - Elimina todos los libros", async () => {
				const res = await chai.request(app).delete("/api/libros");
				expect(res).to.have.status(204);

				const res2 = await chai.request(app).get("/api/libros");
				expect(res2.body.length).to.equal(0);
				await db.reiniciar();
			});
		});

		describe("Clientes - CRUD", () => {
			let clienteCreadoId;

			it("POST /api/clientes - Crea cliente y verifica todos los atributos", (done) => {
				const nuevoCliente = {
					dni: `${Date.now().toString().slice(-8)}Z`,
					nombre: "Nuevo",
					apellidos: "Cliente REST",
					direccion: "Calle REST 123",
					telefono: "699999999",
					email: `nuevo${Date.now()}@mail.com`,
					password: "Password123",
					passwordConfirm: "Password123",
				};

				chai
					.request(app)
					.post("/api/clientes")
					.send(nuevoCliente)
					.end((err, res) => {
						expect(res).to.have.status(201);

						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.dni).to.equal(nuevoCliente.dni);
						expect(res.body.nombre).to.equal(nuevoCliente.nombre);
						expect(res.body.apellidos).to.equal(nuevoCliente.apellidos);
						expect(res.body.direccion).to.equal(nuevoCliente.direccion);
						expect(res.body.telefono).to.equal(nuevoCliente.telefono);
						expect(res.body.email).to.equal(nuevoCliente.email.toLowerCase());
						expect(res.body.rol).to.equal("CLIENTE");
						expect(res.body.password).to.be.undefined;

						clienteCreadoId = res.body.id;
						done();
					});
			});

			it("GET /api/clientes/:id - Obtiene cliente y verifica todos los atributos", (done) => {
				chai
					.request(app)
					.get(`/api/clientes/${clienteCreadoId}`)
					.end((err, res) => {
						expect(res).to.have.status(200);

						expect(res.body.id).to.equal(clienteCreadoId);
						expect(res.body.dni).to.be.a("string");
						expect(res.body.nombre).to.be.a("string");
						expect(res.body.apellidos).to.be.a("string");
						expect(res.body.direccion).to.be.a("string");
						expect(res.body.telefono).to.be.a("string");
						expect(res.body.email).to.be.a("string");
						expect(res.body.rol).to.equal("CLIENTE");
						done();
					});
			});

			it("PUT /api/clientes/:id - Actualiza cliente y verifica todos los atributos", (done) => {
				const actualizaciones = {
					nombre: "Cliente Actualizado",
					direccion: "Nueva Dirección REST",
					telefono: "688888888",
				};

				chai
					.request(app)
					.put(`/api/clientes/${clienteCreadoId}`)
					.send(actualizaciones)
					.end((err, res) => {
						expect(res).to.have.status(200);

						expect(res.body.id).to.equal(clienteCreadoId);
						expect(res.body.nombre).to.equal(actualizaciones.nombre);
						expect(res.body.direccion).to.equal(actualizaciones.direccion);
						expect(res.body.telefono).to.equal(actualizaciones.telefono);
						expect(res.body.dni).to.be.a("string");
						expect(res.body.apellidos).to.be.a("string");
						expect(res.body.email).to.be.a("string");
						expect(res.body.rol).to.equal("CLIENTE");
						done();
					});
			});

			it("GET /api/clientes?email=... - Filtra por email y verifica atributos", (done) => {
				chai
					.request(app)
					.get("/api/clientes?email=juan@mail.com")
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.be.at.least(1);

						const cliente = res.body[0];
						expect(cliente.id).to.be.a("string").with.lengthOf(24);
						expect(cliente.email).to.equal("juan@mail.com");
						expect(cliente.dni).to.be.a("string");
						expect(cliente.nombre).to.be.a("string");
						expect(cliente.apellidos).to.be.a("string");
						done();
					});
			});

			it("DELETE /api/clientes/:id - Elimina cliente correctamente", (done) => {
				chai
					.request(app)
					.delete(`/api/clientes/${clienteCreadoId}`)
					.end((err, res) => {
						expect(res).to.have.status(204);
						done();
					});
			});

			it("PUT /api/clientes - Reemplazo masivo de clientes", async () => {
				const nuevosClientes = [
					{
						dni: "11111111A",
						nombre: "Bulk1",
						apellidos: "Client",
						email: "bulk1@mail.com",
						direccion: "Calle Test",
						telefono: "600111222",
						password: "Password123",
					},
					{
						dni: "22222222B",
						nombre: "Bulk2",
						apellidos: "Client",
						email: "bulk2@mail.com",
						direccion: "Calle Test",
						telefono: "600111222",
						password: "Password123",
					},
				];

				const res = await chai
					.request(app)
					.put("/api/clientes")
					.send(nuevosClientes);

				expect(res).to.have.status(200);
				expect(res.body).to.be.an("array");
				expect(res.body.length).to.equal(2);

				res.body.forEach((cliente, index) => {
					expect(cliente.id).to.be.a("string").with.lengthOf(24);
					expect(cliente.dni).to.equal(nuevosClientes[index].dni);
					expect(cliente.nombre).to.equal(nuevosClientes[index].nombre);
					expect(cliente.apellidos).to.equal(nuevosClientes[index].apellidos);
				});

				await db.reiniciar();
			});
		});

		describe("Admins - CRUD", () => {
			let adminCreadoId;

			it("POST /api/admins - Crea admin y verifica todos los atributos", (done) => {
				const nuevoAdmin = {
					dni: `${Date.now().toString().slice(-8)}A`,
					nombre: "Admin",
					apellidos: "Test REST",
					direccion: "Admin St",
					telefono: "600000000",
					email: `admin${Date.now()}@test.com`,
					password: "Admin123",
					rol: "ADMIN",
				};

				chai
					.request(app)
					.post("/api/admins")
					.send(nuevoAdmin)
					.end((err, res) => {
						expect(res).to.have.status(201);

						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.dni).to.equal(nuevoAdmin.dni);
						expect(res.body.nombre).to.equal(nuevoAdmin.nombre);
						expect(res.body.apellidos).to.equal(nuevoAdmin.apellidos);
						expect(res.body.direccion).to.equal(nuevoAdmin.direccion);
						expect(res.body.telefono).to.equal(nuevoAdmin.telefono);
						expect(res.body.email).to.equal(nuevoAdmin.email.toLowerCase());
						expect(res.body.rol).to.equal("ADMIN");

						adminCreadoId = res.body.id;
						done();
					});
			});

			it("PUT /api/admins/:id - Actualiza admin y verifica atributos", (done) => {
				chai
					.request(app)
					.put(`/api/admins/${adminCreadoId}`)
					.send({ nombre: "Admin Actualizado" })
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body.id).to.equal(adminCreadoId);
						expect(res.body.nombre).to.equal("Admin Actualizado");
						expect(res.body.rol).to.equal("ADMIN");
						done();
					});
			});

			it("DELETE /api/admins/:id - Elimina admin correctamente", (done) => {
				chai
					.request(app)
					.delete(`/api/admins/${adminCreadoId}`)
					.end((err, res) => {
						expect(res).to.have.status(204);
						done();
					});
			});
		});

		describe("Carro - CRUD", () => {
			let testClienteId;
			let testLibroId;

			before(async function () {
				const librosRes = await chai.request(app).get("/api/libros");
				testLibroId = librosRes.body[0].id;

				const loginRes = await chai
					.request(app)
					.post("/api/clientes/autenticar")
					.send({ email: "juan@mail.com", password: "Juanperez123" });
				testClienteId = loginRes.body.id;
			});

			it("POST /api/clientes/:id/carro/items - Añade item y verifica atributos", (done) => {
				chai
					.request(app)
					.post(`/api/clientes/${testClienteId}/carro/items`)
					.send({ libroId: testLibroId, cantidad: 2 })
					.end((err, res) => {
						expect(res).to.have.status(201);
						expect(res.body).to.be.an("array");

						const item = res.body.find((i) => i.libroId === testLibroId);
						expect(item).to.exist;
						expect(item.libroId).to.equal(testLibroId);
						expect(item.cantidad).to.equal(2);
						done();
					});
			});

			it("GET /api/clientes/:id/carro - Obtiene carro y verifica atributos", (done) => {
				chai
					.request(app)
					.get(`/api/clientes/${testClienteId}/carro`)
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");

						if (res.body.length > 0) {
							const item = res.body[0];
							expect(item.libroId).to.be.a("string");
							expect(item.cantidad).to.be.a("number");
						}
						done();
					});
			});

			it("PUT /api/clientes/:id/carro/items/:index - Actualiza cantidad", (done) => {
				chai
					.request(app)
					.put(`/api/clientes/${testClienteId}/carro/items/0`)
					.send({ cantidad: 5 })
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");

						if (res.body.length > 0) {
							expect(res.body[0].cantidad).to.equal(5);
						}
						done();
					});
			});

			it("DELETE /api/clientes/:id/carro/items/:index - Elimina item", (done) => {
				chai
					.request(app)
					.delete(`/api/clientes/${testClienteId}/carro/items/0`)
					.end((err, res) => {
						expect(res).to.have.status(200);
						done();
					});
			});

			it("DELETE /api/clientes/:id/carro - Vacía carro", async () => {
				await chai
					.request(app)
					.post(`/api/clientes/${testClienteId}/carro/items`)
					.send({ libroId: testLibroId, cantidad: 1 });

				const res = await chai
					.request(app)
					.delete(`/api/clientes/${testClienteId}/carro`);

				expect(res).to.have.status(204);
			});
		});

		describe("Facturas - CRUD", () => {
			let testClienteId;
			let testLibroId;
			let facturaCreada;

			before(async function () {
				await db.reiniciar();
				const librosRes = await chai.request(app).get("/api/libros");
				testLibroId = librosRes.body[0].id;

				const loginRes = await chai
					.request(app)
					.post("/api/clientes/autenticar")
					.send({ email: "maria@mail.com", password: "Maria123" });
				testClienteId = loginRes.body.id;
			});

			it("POST /api/compras - Crea compra y verifica todos los atributos", (done) => {
				const compra = {
					clienteId: testClienteId,
					items: [{ libroId: testLibroId, cantidad: 2 }],
					envio: {
						nombre: "Maria Lopez",
						direccion: "Calle Mayor 1",
						ciudad: "Madrid",
						cp: "28001",
						telefono: "600000002",
					},
				};

				chai
					.request(app)
					.post("/api/compras")
					.send(compra)
					.end((err, res) => {
						expect(res).to.have.status(201);

						expect(res.body.id).to.be.a("string").with.lengthOf(24);
						expect(res.body.numero).to.be.a("string");
						expect(res.body.fecha).to.be.a("string");
						expect(res.body.clienteId).to.equal(testClienteId);
						expect(res.body.total).to.be.a("number");
						expect(res.body.total).to.be.above(0);

						expect(res.body.items).to.be.an("array");
						expect(res.body.items.length).to.equal(1);
						expect(res.body.items[0].libroId).to.equal(testLibroId);
						expect(res.body.items[0].cantidad).to.equal(2);

						expect(res.body.envio).to.be.an("object");
						expect(res.body.envio.nombre).to.equal(compra.envio.nombre);
						expect(res.body.envio.direccion).to.equal(compra.envio.direccion);
						expect(res.body.envio.ciudad).to.equal(compra.envio.ciudad);
						expect(res.body.envio.cp).to.equal(compra.envio.cp);
						expect(res.body.envio.telefono).to.equal(compra.envio.telefono);

						facturaCreada = res.body;
						done();
					});
			});

			it("GET /api/facturas/:id - Obtiene factura y verifica todos los atributos", (done) => {
				chai
					.request(app)
					.get(`/api/facturas/${facturaCreada.id}`)
					.end((err, res) => {
						expect(res).to.have.status(200);

						expect(res.body.id).to.equal(facturaCreada.id);
						expect(res.body.numero).to.equal(facturaCreada.numero);
						expect(res.body.clienteId).to.equal(testClienteId);
						expect(res.body.total).to.equal(facturaCreada.total);
						expect(res.body.items).to.be.an("array");
						expect(res.body.envio.nombre).to.equal(facturaCreada.envio.nombre);
						expect(res.body.envio.direccion).to.equal(
							facturaCreada.envio.direccion
						);
						expect(res.body.envio.ciudad).to.equal(facturaCreada.envio.ciudad);
						expect(res.body.envio.cp).to.equal(facturaCreada.envio.cp);
						expect(res.body.envio.telefono).to.equal(
							facturaCreada.envio.telefono
						);
						done();
					});
			});

			it("GET /api/facturas?cliente=... - Filtra por cliente y verifica atributos", (done) => {
				chai
					.request(app)
					.get(`/api/facturas?cliente=${testClienteId}`)
					.end((err, res) => {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an("array");
						expect(res.body.length).to.be.at.least(1);

						const factura = res.body.find((f) => f.id === facturaCreada.id);
						expect(factura, "factura creada debe aparecer en filtro").to.exist;
						expect(factura.id).to.equal(facturaCreada.id);
						expect(factura.numero).to.equal(facturaCreada.numero);
						expect(factura.fecha).to.be.a("string");
						expect(factura.clienteId).to.equal(testClienteId);
						expect(factura.total).to.equal(facturaCreada.total);

						expect(factura.items).to.be.an("array").with.lengthOf(1);
						expect(factura.items[0].libroId).to.equal(testLibroId);
						expect(factura.items[0].cantidad).to.equal(2);

						expect(factura.envio).to.be.an("object");
						expect(factura.envio.nombre).to.equal(facturaCreada.envio.nombre);
						expect(factura.envio.direccion).to.equal(
							facturaCreada.envio.direccion
						);
						expect(factura.envio.ciudad).to.equal(facturaCreada.envio.ciudad);
						expect(factura.envio.cp).to.equal(facturaCreada.envio.cp);
						expect(factura.envio.telefono).to.equal(
							facturaCreada.envio.telefono
						);
						done();
					});
			});

			it("PUT /api/facturas - Reemplazo masivo de facturas", async () => {
				const nuevasFacturas = [
					{
						clienteId: testClienteId,
						total: 100,
						items: [],
						numero: "FAC-001-BULK",
						fecha: new Date().toISOString(),
						envio: {
							nombre: "Test User 1",
							direccion: "Calle Test 1",
							ciudad: "Madrid",
							cp: "28001",
							telefono: "600111222",
						},
					},
					{
						clienteId: testClienteId,
						total: 200,
						items: [],
						numero: "FAC-002-BULK",
						fecha: new Date().toISOString(),
						envio: {
							nombre: "Test User 2",
							direccion: "Calle Test 2",
							ciudad: "Barcelona",
							cp: "08001",
							telefono: "600333444",
						},
					},
				];

				const res = await chai
					.request(app)
					.put("/api/facturas")
					.send(nuevasFacturas);

				expect(res).to.have.status(200);
				expect(res.body).to.be.an("array");
				expect(res.body.length).to.equal(2);

				res.body.forEach((factura, index) => {
					expect(factura.id).to.be.a("string").with.lengthOf(24);
					expect(factura.numero).to.equal(nuevasFacturas[index].numero);
					expect(factura.total).to.equal(nuevasFacturas[index].total);
					expect(factura.fecha).to.be.a("string");
					expect(factura.clienteId).to.equal(testClienteId);
					expect(factura.items).to.be.an("array").with.lengthOf(0);
					expect(factura.envio).to.be.an("object");
					expect(factura.envio.nombre).to.equal(
						nuevasFacturas[index].envio.nombre
					);
					expect(factura.envio.direccion).to.equal(
						nuevasFacturas[index].envio.direccion
					);
					expect(factura.envio.ciudad).to.equal(
						nuevasFacturas[index].envio.ciudad
					);
					expect(factura.envio.cp).to.equal(nuevasFacturas[index].envio.cp);
					expect(factura.envio.telefono).to.equal(
						nuevasFacturas[index].envio.telefono
					);
				});
			});

			it("DELETE /api/facturas - Elimina todas las facturas", async () => {
				const res = await chai.request(app).delete("/api/facturas");
				expect(res).to.have.status(204);
			});
		});
	});

	describe("Cálculos", () => {
		let testClienteId;
		let testLibroId;
		let testLibroPrecio;

		before(async function () {
			await db.reiniciar();
			const librosRes = await chai.request(app).get("/api/libros");
			testLibroId = librosRes.body[0].id;
			testLibroPrecio = librosRes.body[0].precio;

			const loginRes = await chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send({ email: "maria@mail.com", password: "Maria123" });
			testClienteId = loginRes.body.id;
		});

		it("POST /api/compras - Calcula total correctamente", (done) => {
			const cantidad = 2;
			const totalEsperado = testLibroPrecio * cantidad;

			const compra = {
				clienteId: testClienteId,
				items: [{ libroId: testLibroId, cantidad: cantidad }],
				envio: {
					nombre: "Test Calc",
					direccion: "Calle Calc",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000000",
				},
			};

			chai
				.request(app)
				.post("/api/compras")
				.send(compra)
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body.id).to.be.a("string").with.lengthOf(24);
					expect(res.body.numero).to.match(/^FAC-\d{4}$/);
					expect(res.body.fecha).to.be.a("string");
					expect(res.body.clienteId).to.equal(testClienteId);
					expect(res.body.total).to.be.closeTo(totalEsperado, 0.01);

					expect(res.body.items).to.be.an("array").with.lengthOf(1);
					expect(res.body.items[0].libroId).to.equal(testLibroId);
					expect(res.body.items[0].cantidad).to.equal(cantidad);

					expect(res.body.envio).to.be.an("object");
					expect(res.body.envio.nombre).to.equal(compra.envio.nombre);
					expect(res.body.envio.direccion).to.equal(compra.envio.direccion);
					expect(res.body.envio.ciudad).to.equal(compra.envio.ciudad);
					expect(res.body.envio.cp).to.equal(compra.envio.cp);
					expect(res.body.envio.telefono).to.equal(compra.envio.telefono);
					done();
				});
		});

		it("Verifica reducción de stock tras compra", async () => {
			const librosRes = await chai.request(app).get("/api/libros");
			const libro = librosRes.body[0];
			const stockInicial = libro.stock;
			const cantidad = 3;

			const compra = {
				clienteId: testClienteId,
				items: [{ libroId: libro.id, cantidad: cantidad }],
				envio: {
					nombre: "Test Stock",
					direccion: "Calle Stock",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000000",
				},
			};

			await chai.request(app).post("/api/compras").send(compra);

			const libroActualizado = await chai
				.request(app)
				.get(`/api/libros/${libro.id}`);

			expect(libroActualizado.body.stock).to.equal(stockInicial - cantidad);
		});

		it("Calcula total con múltiples items", async () => {
			const librosRes = await chai.request(app).get("/api/libros");
			const libro1 = librosRes.body[0];
			const libro2 = librosRes.body[1];

			const cant1 = 2;
			const cant2 = 3;
			const totalEsperado = libro1.precio * cant1 + libro2.precio * cant2;

			const compra = {
				clienteId: testClienteId,
				items: [
					{ libroId: libro1.id, cantidad: cant1 },
					{ libroId: libro2.id, cantidad: cant2 },
				],
				envio: {
					nombre: "Test Multi",
					direccion: "Calle Multi",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000000",
				},
			};

			const res = await chai.request(app).post("/api/compras").send(compra);

			expect(res).to.have.status(201);
			expect(res.body.id).to.be.a("string").with.lengthOf(24);
			expect(res.body.numero).to.match(/^FAC-\d{4}$/);
			expect(res.body.fecha).to.be.a("string");
			expect(res.body.clienteId).to.equal(testClienteId);
			expect(res.body.total).to.be.closeTo(totalEsperado, 0.01);

			expect(res.body.items).to.be.an("array").with.lengthOf(2);
			expect(res.body.items[0].libroId).to.equal(libro1.id);
			expect(res.body.items[0].cantidad).to.equal(cant1);
			expect(res.body.items[1].libroId).to.equal(libro2.id);
			expect(res.body.items[1].cantidad).to.equal(cant2);

			expect(res.body.envio).to.be.an("object");
			expect(res.body.envio.nombre).to.equal(compra.envio.nombre);
			expect(res.body.envio.direccion).to.equal(compra.envio.direccion);
			expect(res.body.envio.ciudad).to.equal(compra.envio.ciudad);
			expect(res.body.envio.cp).to.equal(compra.envio.cp);
			expect(res.body.envio.telefono).to.equal(compra.envio.telefono);
		});

		it("Genera número de factura secuencial", async () => {
			await db.reiniciar();

			const librosRes = await chai.request(app).get("/api/libros");
			const libro = librosRes.body[0];

			const compraBase = {
				clienteId: testClienteId,
				items: [{ libroId: libro.id, cantidad: 1 }],
				envio: {
					nombre: "Test Seq",
					direccion: "Calle Seq",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000000",
				},
			};

			const res1 = await chai
				.request(app)
				.post("/api/compras")
				.send(compraBase);
			expect(res1.body.numero).to.match(/^FAC-\d{4}$/);
			const num1 = parseInt(res1.body.numero.split("-")[1]);

			const res2 = await chai
				.request(app)
				.post("/api/compras")
				.send(compraBase);
			expect(res2.body.numero).to.match(/^FAC-\d{4}$/);
			const num2 = parseInt(res2.body.numero.split("-")[1]);

			expect(num2).to.equal(num1 + 1);
		});

		it("Rechaza compra si stock insuficiente", async () => {
			const librosRes = await chai.request(app).get("/api/libros");
			const libro = librosRes.body[0];
			const cantidadExcesiva = libro.stock + 100;

			const compra = {
				clienteId: testClienteId,
				items: [{ libroId: libro.id, cantidad: cantidadExcesiva }],
				envio: {
					nombre: "Test Insuf",
					direccion: "Calle Insuf",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000000",
				},
			};

			const res = await chai.request(app).post("/api/compras").send(compra);

			expect(res).to.have.status(400);
		});
	});
});
