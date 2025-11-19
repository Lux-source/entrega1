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
		console.log("DB Reiniciada. Libros:", db.datos.libros.length);
		console.log("DB Reiniciada. Clientes:", db.datos.clientes.length);
	});

	describe("GET /api/libros", () => {
		it("debería devolver una lista de libros", (done) => {
			chai
				.request(app)
				.get("/api/libros")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an("array");
					expect(res.body.length).to.be.greaterThan(0);
					done();
				});
		});
	});

	describe("GET /api/libros/:id", () => {
		it("debería devolver un libro específico", (done) => {
			// Tras reiniciar, sabemos que existe el libro 1
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

		it("debería devolver 404 para un libro inexistente", (done) => {
			chai
				.request(app)
				.get("/api/libros/9999999")
				.end((err, res) => {
					expect(res).to.have.status(404);
					done();
				});
		});
	});

	describe("POST /api/clientes/autenticar", () => {
		it("debería autenticar un cliente existente", (done) => {
			const credenciales = {
				email: "juan@mail.com",
				password: "Juanperez123",
			};
			chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send(credenciales)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("email", "juan@mail.com");
					expect(res.body).to.have.property("rol", "CLIENTE");
					done();
				});
		});

		it("debería fallar con credenciales incorrectas", (done) => {
			const credenciales = {
				email: "juan@mail.com",
				password: "WRONG",
			};
			chai
				.request(app)
				.post("/api/clientes/autenticar")
				.send(credenciales)
				.end((err, res) => {
					expect(res).to.have.status(401);
					done();
				});
		});
	});

	describe("POST /api/admins/autenticar", () => {
		it("debería autenticar un admin existente", (done) => {
			const credenciales = {
				email: "admin@libreria.com",
				password: "Admin123",
			};
			chai
				.request(app)
				.post("/api/admins/autenticar")
				.send(credenciales)
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("rol", "ADMIN");
					done();
				});
		});
	});

	describe("Operaciones de Cliente (Registro y Carro)", () => {
		it("debería registrar un nuevo cliente", (done) => {
			const usuario = {
				dni: `1${Date.now().toString().slice(-7)}X`,
				nombre: "ClienteREST",
				apellidos: "Test",
				direccion: "Calle Test",
				telefono: "600000000",
				email: `rest${Date.now()}@mail.com`,
				password: "Password123",
				passwordConfirm: "Password123",
			};
			chai
				.request(app)
				.post("/api/clientes")
				.send(usuario)
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.have.property("email", usuario.email);
					done();
				});
		});

		it("debería obtener el perfil del cliente 1", (done) => {
			chai
				.request(app)
				.get("/api/clientes/1")
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("id", 1);
					done();
				});
		});

		it("debería añadir un item al carro del cliente 1", (done) => {
			// Tras reiniciar, sabemos que existe el cliente 1 y el libro 1
			chai
				.request(app)
				.post("/api/clientes/1/carro/items")
				.send({ libroId: 1, cantidad: 1 })
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.be.an("array");
					done();
				});
		});
	});

	describe("Gestión de Libros (Admin)", () => {
		let libroCreadoId;

		it("debería crear un nuevo libro", (done) => {
			const libro = {
				titulo: "Libro Test REST",
				autor: "Tester",
				isbn: `TEST-${Date.now()}`,
				precio: 10,
				stock: 5,
			};
			chai
				.request(app)
				.post("/api/libros")
				.send(libro)
				.end((err, res) => {
					expect(res).to.have.status(201);
					expect(res.body).to.have.property("id");
					libroCreadoId = res.body.id;
					done();
				});
		});

		it("debería actualizar el libro creado", (done) => {
			if (!libroCreadoId) return done(new Error("No se creó el libro"));
			chai
				.request(app)
				.put(`/api/libros/${libroCreadoId}`)
				.send({ precio: 15 })
				.end((err, res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.have.property("precio", 15);
					done();
				});
		});

		it("debería eliminar el libro creado", (done) => {
			if (!libroCreadoId) return done(new Error("No se creó el libro"));
			chai
				.request(app)
				.delete(`/api/libros/${libroCreadoId}`)
				.end((err, res) => {
					expect(res).to.have.status(204);
					done();
				});
		});
	});
});
