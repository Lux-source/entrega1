import chai from "chai";
import chaiHttp from "chai-http";
import app from "../app.mjs";
import { db } from "../server/data/db-context.mjs";
import { conectarDB, desconectarDB } from "../server/config/database.mjs";

chai.use(chaiHttp);
const expect = chai.expect;

describe("REST API Tests", () => {
	before(async () => {
		await conectarDB();
		await db.reiniciar();
		console.log("DB Reiniciada para tests.");
	});

	after(async () => {
		await db.reiniciar();
		await desconectarDB();
	});

	describe("Bloque A: Libros y Catálogo", () => {
		it("GET /api/libros - Debería devolver todos los libros", (done) => {
			chai
				.request(app)
				.get("/api/libros")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(4);
					done();
				});
		});

		it("GET /api/libros?min=10&max=20 - Debería filtrar por precio", (done) => {
			chai
				.request(app)
				.get("/api/libros?min=10&max=20")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					const preciosEnRango = res.body.every(
						(l) => l.precio >= 10 && l.precio <= 20
					);
					expect(preciosEnRango).to.be.true;
					done();
				});
		});

		it("GET /api/libros/:id - Debería devolver un libro específico", (done) => {
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
							expect(res.body).to.have.property("id", primerLibro.id);
							expect(res.body).to.have.property("titulo");

							expect(res.body.id).to.be.a("string");
							expect(res.body.id).to.have.lengthOf(24);
							done();
						});
				});
		});

		it("GET /api/libros/507f1f77bcf86cd799999999 - Debería devolver 404 para libro inexistente", (done) => {
			chai
				.request(app)
				.get("/api/libros/507f1f77bcf86cd799999999")
				.end((err, res) => {
					expect(res).to.have.status(404);
					done();
				});
		});

		let libroCreadoId;
		it("POST /api/libros - Admin debería crear un libro", (done) => {
			const nuevoLibro = {
				titulo: "Libro Test Admin",
				autor: "Admin Author",
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
					expect(res.body).to.have.property("id");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					libroCreadoId = res.body.id;
					done();
				});
		});

		it("PUT /api/libros/:id - Admin debería actualizar un libro", (done) => {
			if (!libroCreadoId) return done(new Error("No se creó el libro"));
			chai
				.request(app)
				.put(`/api/libros/${libroCreadoId}`)
				.send({ precio: 30.0 })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("precio", 30.0);
					done();
				});
		});

		it("DELETE /api/libros/:id - Admin debería eliminar un libro", (done) => {
			if (!libroCreadoId) return done(new Error("No se creó el libro"));
			chai
				.request(app)
				.delete(`/api/libros/${libroCreadoId}`)
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});

		it("GET /api/libros?titulo=Libro 1 - Debería filtrar por título", (done) => {
			chai
				.request(app)
				.get("/api/libros?titulo=Libro 1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("object");
					expect(res.body.titulo).to.equal("Libro 1");
					done();
				});
		});

		it("GET /api/libros?isbn=978-84-376-0494-7 - Debería filtrar por ISBN", (done) => {
			chai
				.request(app)
				.get("/api/libros?isbn=978-84-376-0494-7")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("object");
					expect(res.body.isbn).to.equal("978-84-376-0494-7");
					done();
				});
		});

		it("PUT /api/libros - Debería reemplazar todos los libros (Bulk)", (done) => {
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
					expect(res.body[0]).to.have.property("id"); // IDs asignados
					done();
				});
		});

		it("DELETE /api/libros - Debería eliminar todos los libros (Bulk)", (done) => {
			chai
				.request(app)
				.delete("/api/libros")
				.end(async (err, res) => {
					expect(res).to.have.status(204);
					const res2 = await chai.request(app).get("/api/libros");
					expect(res2.body.length).to.equal(0);

					await db.reiniciar();
					done();
				});
		});
	});

	describe("Bloque B: Usuarios", () => {
		it("POST /api/clientes/autenticar - Login correcto Cliente", (done) => {
			chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send({ email: "juan@mail.com", password: "Juanperez123" })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("rol", "CLIENTE");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					done();
				});
		});

		it("POST /api/clientes/autenticar - Login incorrecto", (done) => {
			chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send({ email: "juan@mail.com", password: "WRONG" })
				.end((err, res) => {
					expect(res).to.have.status(401);
					done();
				});
		});

		it("POST /api/admins/autenticar - Login correcto Admin", (done) => {
			chai
				.request(app)
				.post("/api/admins/autenticar")
				.send({ email: "admin@libreria.com", password: "Admin123" })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("rol", "ADMIN");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					done();
				});
		});

		it("POST /api/admins/autenticar - Login incorrecto", (done) => {
			chai
				.request(app)
				.post("/api/admins/autenticar")
				.send({ email: "admin@libreria.com", password: "WRONG" })
				.end((err, res) => {
					expect(res).to.have.status(401);
					done();
				});
		});

		let nuevoClienteId;
		it("POST /api/clientes - Registro de nuevo cliente", (done) => {
			const nuevoCliente = {
				dni: `${Date.now().toString().slice(-8)}Z`,
				nombre: "Nuevo",
				apellidos: "Cliente",
				direccion: "Calle Nueva",
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
					expect(res.body).to.have.property("email", nuevoCliente.email);
					expect(res.body).to.have.property("id");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					nuevoClienteId = res.body.id;
					done();
				});
		});

		it("GET /api/clientes/:id - Ver perfil de cliente", (done) => {
			if (!nuevoClienteId) return done(new Error("No se creó el cliente"));
			chai
				.request(app)
				.get(`/api/clientes/${nuevoClienteId}`)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", nuevoClienteId);
					done();
				});
		});

		it("PUT /api/clientes/:id - Actualizar perfil de cliente", (done) => {
			if (!nuevoClienteId) return done(new Error("No se creó el cliente"));
			chai
				.request(app)
				.put(`/api/clientes/${nuevoClienteId}`)
				.send({ nombre: "Juan Actualizado" })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("nombre", "Juan Actualizado");
					done();
				});
		});

		it("GET /api/clientes - Listar clientes (Admin)", (done) => {
			chai
				.request(app)
				.get("/api/clientes")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(2); // Semilla tiene 2
					done();
				});
		});

		it("DELETE /api/clientes/:id - Eliminar cliente", (done) => {
			if (!nuevoClienteId) return done(new Error("No se creó el cliente"));
			chai
				.request(app)
				.delete(`/api/clientes/${nuevoClienteId}`)
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});

		it("GET /api/clientes?email=juan@mail.com - Filtrar por email", (done) => {
			chai
				.request(app)
				.get("/api/clientes?email=juan@mail.com")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(1);
					expect(res.body[0].email).to.equal("juan@mail.com");
					done();
				});
		});

		it("GET /api/clientes?dni=11111111B - Filtrar por DNI", (done) => {
			chai
				.request(app)
				.get("/api/clientes?dni=11111111B")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(1);
					expect(res.body[0].dni).to.equal("11111111B");
					done();
				});
		});

		it("PUT /api/clientes - Reemplazo masivo de clientes", (done) => {
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
			chai
				.request(app)
				.put("/api/clientes")
				.send(nuevosClientes)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.equal(2);
					done();
				});
		});

		it("DELETE /api/clientes - Borrado masivo de clientes", (done) => {
			chai
				.request(app)
				.delete("/api/clientes")
				.end(async (err, res) => {
					expect(res).to.have.status(204);

					await db.reiniciar();
					done();
				});
		});
	});

	describe("Bloque C: Carrito", () => {
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

		it("POST /api/clientes/:id/carro/items - Añadir item al carro", (done) => {
			chai
				.request(app)
				.post(`/api/clientes/${testClienteId}/carro/items`)
				.send({ libroId: testLibroId, cantidad: 2 })
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.be.an("array");

					const item = res.body.find((i) => i.libroId === testLibroId);
					expect(item).to.exist;
					expect(item.cantidad).to.equal(2);
					done();
				});
		});

		it("GET /api/clientes/:id/carro - Obtener carro", (done) => {
			chai
				.request(app)
				.get(`/api/clientes/${testClienteId}/carro`)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.greaterThan(0);
					done();
				});
		});

		it("PUT /api/clientes/:id/carro/items/:index - Actualizar cantidad item", (done) => {
			chai
				.request(app)
				.put(`/api/clientes/${testClienteId}/carro/items/0`)
				.send({ cantidad: 5 })
				.end((err, res) => {
					expect(res).to.have.status(200);

					const item = res.body.find(
						(i) =>
							i.libroId === testLibroId ||
							i.libroId?.toString() === testLibroId ||
							i.libroId?.id === testLibroId ||
							i.libroId?._id?.toString() === testLibroId
					);
					expect(item).to.not.be.undefined;
					expect(item.cantidad).to.equal(5);
					done();
				});
		});

		it("DELETE /api/clientes/:id/carro/items/:index - Eliminar item del carro", (done) => {
			chai
				.request(app)
				.delete(`/api/clientes/${testClienteId}/carro/items/0`)
				.end((err, res) => {
					expect(res).to.have.status(200);
					const item = res.body.find((i) => i.libroId === testLibroId);
					expect(item).to.not.exist;
					done();
				});
		});

		it("DELETE /api/clientes/:id/carro - Vaciar carro", (done) => {
			const libros = chai.request(app).get("/api/libros");
			libros.then((librosRes) => {
				const libroId = librosRes.body[1].id;
				chai
					.request(app)
					.post(`/api/clientes/${testClienteId}/carro/items`)
					.send({ libroId: libroId, cantidad: 1 })
					.end(() => {
						chai
							.request(app)
							.delete(`/api/clientes/${testClienteId}/carro`)
							.end((err, res) => {
								expect(res).to.have.status(204);
								done();
							});
					});
			});
		});
	});

	describe("Bloque D: Facturación y Cálculos", () => {
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

		it("POST /api/compras - Realizar compra y verificar cálculos", (done) => {
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
					expect(res.body).to.have.property("id");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					expect(res.body).to.have.property("total");
					expect(res.body.total).to.equal(31.9);
					facturaCreada = res.body;
					done();
				});
		});

		it("Verificar reducción de stock tras compra", (done) => {
			chai
				.request(app)
				.get(`/api/libros/${testLibroId}`)
				.end((err, res) => {
					expect(res).to.have.status(200);

					expect(res.body.stock).to.equal(22);
					done();
				});
		});

		it("GET /api/compras - Listar facturas (Admin/Cliente)", (done) => {
			chai
				.request(app)
				.get("/api/compras")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.greaterThan(0);
					done();
				});
		});

		it("GET /api/facturas/:id - Obtener detalle de factura", (done) => {
			if (!facturaCreada) return done(new Error("No se creó la factura"));
			chai
				.request(app)
				.get(`/api/facturas/${facturaCreada.id}`)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", facturaCreada.id);
					expect(res.body).to.have.property("items");
					done();
				});
		});

		it("GET /api/facturas?numero=FAC-0002 - Filtrar por número", (done) => {
			chai
				.request(app)
				.get("/api/facturas?numero=FAC-0002")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					if (res.body.length > 0) {
						expect(res.body[0].numero).to.equal("FAC-0002");

						expect(res.body[0].id).to.be.a("string");
						expect(res.body[0].id).to.have.lengthOf(24);
					}
					done();
				});
		});

		it("GET /api/facturas?cliente=<clienteId> - Filtrar por cliente", (done) => {
			chai
				.request(app)
				.get(`/api/facturas?cliente=${testClienteId}`)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					done();
				});
		});

		it("PUT /api/facturas - Reemplazo masivo de facturas", (done) => {
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
			chai
				.request(app)
				.put("/api/facturas")
				.send(nuevasFacturas)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.equal(2);

					expect(res.body[0].id).to.be.a("string");
					expect(res.body[0].id).to.have.lengthOf(24);
					done();
				});
		});

		it("DELETE /api/facturas - Borrado masivo de facturas", (done) => {
			chai
				.request(app)
				.delete("/api/facturas")
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});
	});

	describe("Bloque E: Gestión de Admins", () => {
		let adminId;
		it("POST /api/admins - Crear nuevo admin", (done) => {
			const nuevoAdmin = {
				dni: `${Date.now().toString().slice(-8)}A`,
				nombre: "AdminTest",
				apellidos: "Test",
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
					expect(res.body).to.have.property("id");

					expect(res.body.id).to.be.a("string");
					expect(res.body.id).to.have.lengthOf(24);
					adminId = res.body.id;
					done();
				});
		});

		it("GET /api/admins - Listar admins", (done) => {
			chai
				.request(app)
				.get("/api/admins")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(2);
					done();
				});
		});

		it("PUT /api/admins/:id - Actualizar admin", (done) => {
			if (!adminId) return done(new Error("No admin created"));
			chai
				.request(app)
				.put(`/api/admins/${adminId}`)
				.send({ nombre: "AdminUpdated" })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body.nombre).to.equal("AdminUpdated");
					done();
				});
		});

		it("DELETE /api/admins/:id - Eliminar admin", (done) => {
			if (!adminId) return done(new Error("No admin created"));
			chai
				.request(app)
				.delete(`/api/admins/${adminId}`)
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});

		it("GET /api/admins?email=admin@libreria.com - Filtrar por email", (done) => {
			chai
				.request(app)
				.get("/api/admins?email=admin@libreria.com")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(1);
					expect(res.body[0].email).to.equal("admin@libreria.com");
					done();
				});
		});

		it("GET /api/admins?dni=00000000A - Filtrar por DNI", (done) => {
			chai
				.request(app)
				.get("/api/admins?dni=00000000A")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.at.least(1);
					expect(res.body[0].dni).to.equal("00000000A");
					done();
				});
		});

		it("PUT /api/admins - Reemplazo masivo de admins", (done) => {
			const nuevosAdmins = [
				{
					nombre: "BulkAdmin1",
					apellidos: "Apellidos Admin 1",
					email: "ba1@test.com",
					dni: "11111111A",
					direccion: "Calle Admin 1",
					telefono: "111222333",
					password: "Password123",
					rol: "ADMIN",
				},
				{
					nombre: "BulkAdmin2",
					apellidos: "Apellidos Admin 2",
					email: "ba2@test.com",
					dni: "22222222B",
					direccion: "Calle Admin 2",
					telefono: "444555666",
					password: "Password456",
					rol: "ADMIN",
				},
			];
			chai
				.request(app)
				.put("/api/admins")
				.send(nuevosAdmins)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.equal(2);
					done();
				});
		});

		it("DELETE /api/admins - Borrado masivo de admins", (done) => {
			chai
				.request(app)
				.delete("/api/admins")
				.end(async (err, res) => {
					expect(res).to.have.status(204);

					await db.reiniciar();
					done();
				});
		});
	});
});
