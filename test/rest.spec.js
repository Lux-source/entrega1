import chai from "chai";
import chaiHttp from "chai-http";
import app from "../app.mjs";
import { db } from "../server/data/db-context.mjs";

chai.use(chaiHttp);
const expect = chai.expect;

describe("REST API Tests", () => {
	before(async () => {
		// Reiniciar la DB a un estado conocido (semilla) antes de los tests
		await db.reiniciar();
		console.log("DB Reiniciada para tests.");
	});

	// BLOQUE A: LIBROS Y CATÁLOGO
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
					// Libros semilla en rango 10-20:
					// Libro 1 (15.95), Libro 2 (18.9), Libro 3 (12.5). Libro 4 (9.95) fuera.
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
				.get("/api/libros/1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", 1);
					expect(res.body).to.have.property("titulo");
					done();
				});
		});

		it("GET /api/libros/999 - Debería devolver 404 para libro inexistente", (done) => {
			chai
				.request(app)
				.get("/api/libros/999")
				.end((err, res) => {
					expect(res).to.have.status(404);
					done();
				});
		});

		// Admin CRUD
		let libroCreadoId;
		it("POST /api/libros - Admin debería crear un libro", (done) => {
			const nuevoLibro = {
				titulo: "Libro Test Admin",
				autor: "Admin Author",
				isbn: "123-456-789",
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
					// El controlador devuelve un objeto único si encuentra coincidencia por título
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
					// El controlador devuelve un objeto único si encuentra coincidencia por ISBN
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
					expect(res).to.have.status(200); // O 201 según implementación
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
					// Verificar que está vacío
					const res2 = await chai.request(app).get("/api/libros");
					expect(res2.body.length).to.equal(0);

					// Restaurar DB para siguientes tests
					await db.reiniciar();
					done();
				});
		});
	});

	// BLOQUE B: USUARIOS
	describe("Bloque B: Usuarios", () => {
		it("POST /api/clientes/autenticar - Login correcto Cliente", (done) => {
			chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send({ email: "juan@mail.com", password: "Juanperez123" })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("rol", "CLIENTE");
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
					done();
				});
		});

		let nuevoClienteId;
		it("POST /api/clientes - Registro de nuevo cliente", (done) => {
			const nuevoCliente = {
				dni: `99999999Z`,
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
					nuevoClienteId = res.body.id;
					done();
				});
		});

		it("GET /api/clientes/:id - Ver perfil de cliente", (done) => {
			chai
				.request(app)
				.get("/api/clientes/1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", 1);
					done();
				});
		});

		it("PUT /api/clientes/:id - Actualizar perfil de cliente", (done) => {
			chai
				.request(app)
				.put("/api/clientes/1")
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
					password: "Pass",
				},
				{
					dni: "22222222B",
					nombre: "Bulk2",
					apellidos: "Client",
					email: "bulk2@mail.com",
					password: "Pass",
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
					// Restaurar DB para siguientes tests
					await db.reiniciar();
					done();
				});
		});
	});

	// BLOQUE C: CARRITO
	describe("Bloque C: Carrito", () => {
		it("POST /api/clientes/:id/carro/items - Añadir item al carro", (done) => {
			chai
				.request(app)
				.post("/api/clientes/1/carro/items")
				.send({ libroId: 1, cantidad: 2 })
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.be.an("array");
					// Verificar que el item está en el carro
					const item = res.body.find((i) => i.libroId === 1);
					expect(item).to.exist;
					expect(item.cantidad).to.equal(2);
					done();
				});
		});

		it("GET /api/clientes/:id/carro - Obtener carro", (done) => {
			chai
				.request(app)
				.get("/api/clientes/1/carro")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.greaterThan(0);
					done();
				});
		});

		it("PUT /api/clientes/:id/carro/items/:index - Actualizar cantidad item", (done) => {
			// Index 0 es el primer item (Libro 1, añadido en test anterior)
			chai
				.request(app)
				.put("/api/clientes/1/carro/items/0")
				.send({ cantidad: 5 })
				.end((err, res) => {
					expect(res).to.have.status(200);
					const item = res.body.find((i) => i.libroId === 1);
					expect(item.cantidad).to.equal(5);
					done();
				});
		});

		it("DELETE /api/clientes/:id/carro/items/:index - Eliminar item del carro", (done) => {
			chai
				.request(app)
				.delete("/api/clientes/1/carro/items/0")
				.end((err, res) => {
					expect(res).to.have.status(200);
					const item = res.body.find((i) => i.libroId === 1);
					expect(item).to.not.exist;
					done();
				});
		});

		it("DELETE /api/clientes/:id/carro - Vaciar carro", (done) => {
			// Añadimos algo primero para asegurar que hay algo que borrar
			chai
				.request(app)
				.post("/api/clientes/1/carro/items")
				.send({ libroId: 2, cantidad: 1 })
				.end(() => {
					chai
						.request(app)
						.delete("/api/clientes/1/carro")
						.end((err, res) => {
							expect(res).to.have.status(204);
							done();
						});
				});
		});
	});

	// BLOQUE D: FACTURACIÓN Y CÁLCULOS
	describe("Bloque D: Facturación y Cálculos", () => {
		// Libro 1 precio: 15.95. Stock inicial: 25.
		// Compraremos 2 unidades. Total esperado: 31.9. Stock final: 23.

		it("POST /api/compras - Realizar compra y verificar cálculos", (done) => {
			const compra = {
				clienteId: 1,
				items: [{ libroId: 1, cantidad: 2 }],
				envio: {
					nombre: "Juan Perez",
					direccion: "Calle Mayor 1",
					ciudad: "Madrid",
					cp: "28001",
					telefono: "600000001",
				},
			};

			chai
				.request(app)
				.post("/api/compras")
				.send(compra)
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.have.property("id");
					expect(res.body).to.have.property("total");

					// Verificación de Cálculo (15.95 * 2 = 31.9)
					expect(res.body.total).to.equal(31.9);
					done();
				});
		});

		it("Verificar reducción de stock tras compra", (done) => {
			chai
				.request(app)
				.get("/api/libros/1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					// Stock inicial 25.
					// Semilla: Compra Cliente 1 (1 ud) -> 24.
					// Test Compra: 2 uds -> 22.
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
			// Usamos la factura 1 de la semilla
			chai
				.request(app)
				.get("/api/facturas/1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", 1);
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
					// Depende de si existe la factura (semilla)
					if (res.body.length > 0) {
						expect(res.body[0].numero).to.equal("FAC-0002");
					}
					done();
				});
		});

		it("GET /api/facturas?cliente=1 - Filtrar por cliente", (done) => {
			chai
				.request(app)
				.get("/api/facturas?cliente=1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					done();
				});
		});

		it("PUT /api/facturas - Reemplazo masivo de facturas", (done) => {
			// Nota: Las facturas suelen ser complejas de crear masivamente sin contexto,
			// pero probamos que el endpoint responda.
			const nuevasFacturas = [
				{ clienteId: 1, total: 100, items: [] },
				{ clienteId: 1, total: 200, items: [] },
			];
			chai
				.request(app)
				.put("/api/facturas")
				.send(nuevasFacturas)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.equal(2);
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

	// BLOQUE E: GESTIÓN DE ADMINS
	describe("Bloque E: Gestión de Admins", () => {
		let adminId;
		it("POST /api/admins - Crear nuevo admin", (done) => {
			const nuevoAdmin = {
				dni: "88888888A",
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
					expect(res.body.length).to.be.at.least(2); // Semilla + Creado
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
					email: "ba1@test.com",
					password: "123",
					rol: "ADMIN",
				},
				{
					nombre: "BulkAdmin2",
					email: "ba2@test.com",
					password: "123",
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
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});
	});
});
