import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// --- NUEVO: Importamos el modelo y servicios DEL SERVIDOR ---
// Fíjate que la ruta ahora es './servidor/' y NO './public/...'
import { model } from "./servidor/seeder.mjs";
import { servicioAutenticacion } from "./servidor/auth-service.mjs";
import { Libro } from "./servidor/libro.mjs";
import { Usuario } from "./servidor/usuario.mjs";

// --- NUEVO: Inicializamos datos que no existen en P1 ---
// El PDF pide rutas de facturas, pero el modelo P1 no las tiene.
// Las inicializamos aquí en la memoria del servidor.
if (!model.facturas) {
	model.facturas = [];
}
// También, para las rutas del carro, asumimos que el
// objeto Usuario en el servidor ahora tiene un array 'carro'.
// Deberías modificar 'servidor/usuario.mjs' para que incluya 'this.carro = []' en el constructor.

// --- Configuración básica de Express (igual que P1) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// --- NUEVO: Middlewares de la API ---
// Necesario para leer JSON en peticiones POST, PUT, PATCH
app.use(express.json());

// --- Servidor de archivos estáticos (Igual que P1) ---
// Sirve tu SPA (index.html, styles.css, y todo el JS del cliente)
app.use(express.static("public"));
app.use("/test", express.static("test"));

// --- NUEVO: Definición de la API REST (/api) ---
// Todas nuestras rutas de la API colgarán de '/api'
const apiRouter = express.Router();
app.use("/api", apiRouter);

// ===============================================
// RUTAS DE LIBROS
// ===============================================

// GET /api/libros (Con filtros por query)
apiRouter.get("/libros", (req, res) => {
	const { isbn, titulo } = req.query;
	let libros = [...model.libros];

	if (isbn) {
		libros = libros.filter((l) =>
			l.isbn?.toLowerCase().includes(isbn.toLowerCase())
		);
	}
	if (titulo) {
		libros = libros.filter((l) =>
			l.titulo?.toLowerCase().includes(titulo.toLowerCase())
		);
	}
	res.json(libros);
});

// POST /api/libros (addLibro)
apiRouter.post("/libros", (req, res) => {
	try {
		const { titulo, autor, isbn, precio, stock } = req.body;
		if (!titulo || !autor || !isbn || !precio || stock === undefined) {
			return res.status(400).json({ error: "Faltan campos obligatorios" });
		}
		const nuevoId = Math.max(0, ...model.libros.map((l) => l.id)) + 1;
		const nuevoLibro = new Libro(
			nuevoId,
			titulo,
			autor,
			isbn,
			Number(precio),
			Number(stock)
		);
		model.libros.push(nuevoLibro);
		res.status(201).json(nuevoLibro);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// GET /api/libros/:id (getLibroPorId)
apiRouter.get("/libros/:id", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const libro = model.libros.find((l) => l.id === id);
	if (libro) {
		res.json(libro);
	} else {
		res.status(404).json({ error: "Libro no encontrado" });
	}
});

// PUT /api/libros/:id (updateLibro)
apiRouter.put("/libros/:id", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const libro = model.libros.find((l) => l.id === id);
	if (!libro) {
		return res.status(404).json({ error: "Libro no encontrado" });
	}
	try {
		// Actualizamos el objeto 'libro' en memoria
		const { titulo, autor, isbn, precio, stock } = req.body;
		libro.titulo = titulo ?? libro.titulo;
		libro.autor = autor ?? libro.autor;
		libro.isbn = isbn ?? libro.isbn;
		libro.setPrecio(precio ?? libro.precio);
		libro.setStock(stock ?? libro.stock);
		res.json(libro);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// DELETE /api/libros/:id (removeLibro)
apiRouter.delete("/libros/:id", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const index = model.libros.findIndex((l) => l.id === id);
	if (index === -1) {
		return res.status(404).json({ error: "Libro no encontrado" });
	}
	model.libros.splice(index, 1);
	res.status(204).send(); // 204 = No Content
});

// DELETE /api/libros (removeLibros)
apiRouter.delete("/libros", (req, res) => {
	model.libros = [];
	res.status(204).send();
});

// ===============================================
// RUTAS DE AUTENTICACIÓN Y USUARIOS
// ===============================================

// --- Función helper para no repetir código entre admin y cliente ---
// Esta función crea todas las rutas CRUD para un ROL específico
const crearRutasUsuario = (rol) => {
	const baseRuta = rol.toLowerCase() + "s"; // 'clientes' o 'admins'
	const rolUpper = rol.toUpperCase();

	// POST /api/clientes/autenticar o /api/admins/autenticar
	apiRouter.post(`/${baseRuta}/autenticar`, async (req, res) => {
		try {
			const { usuario, password } = req.body;
			// Usamos el servicio de autenticación que AHORA vive en el servidor
			const resultado = await servicioAutenticacion.iniciarSesion(
				usuario,
				password,
				rolUpper // Forzamos el ROL correcto
			);
			if (resultado.success) {
				res.json(resultado);
			} else {
				res.status(401).json(resultado); // 401 = No autorizado
			}
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// POST /api/clientes o /api/admins (Registro / addCliente / addAdmin)
	apiRouter.post(`/${baseRuta}`, async (req, res) => {
		try {
			const { dni, nombre, apellidos, direccion, telefono, email, password } =
				req.body;
			// Usamos el servicio de registro
			const resultado = await servicioAutenticacion.registrar(
				dni,
				nombre,
				apellidos,
				direccion,
				telefono,
				email,
				password,
				password, // passwordConfirm (asumimos que ya viene validado del front)
				rolUpper
			);
			if (resultado.success) {
				res.status(201).json(resultado);
			} else {
				res.status(400).json(resultado); // 400 = Bad Request (datos inválidos)
			}
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/clientes o /api/admins (Con filtros)
	apiRouter.get(`/${baseRuta}`, (req, res) => {
		const { email, dni } = req.query;
		let usuarios = model.usuarios.filter((u) => u.rol === rolUpper);

		if (email) {
			usuarios = usuarios.filter(
				(u) => u.email?.toLowerCase() === email.toLowerCase()
			);
		}
		if (dni) {
			usuarios = usuarios.filter(
				(u) => u.dni?.toUpperCase() === dni.toUpperCase()
			);
		}
		res.json(usuarios);
	});

	// GET /api/clientes/:id o /api/admins/:id
	apiRouter.get(`/${baseRuta}/:id`, (req, res) => {
		const id = parseInt(req.params.id, 10);
		const usuario = model.usuarios.find(
			(u) => u.id === id && u.rol === rolUpper
		);
		if (usuario) {
			res.json(usuario);
		} else {
			res.status(404).json({ error: "Usuario no encontrado" });
		}
	});

	// PUT /api/clientes/:id o /api/admins/:id
	apiRouter.put(`/${baseRuta}/:id`, (req, res) => {
		const id = parseInt(req.params.id, 10);
		const usuario = model.usuarios.find(
			(u) => u.id === id && u.rol === rolUpper
		);
		if (!usuario) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}
		try {
			const { nombre, apellidos, dni, email, telefono, direccion, password } =
				req.body;
			// Actualizamos el usuario en memoria
			usuario.nombre = nombre ?? usuario.nombre;
			usuario.apellidos = apellidos ?? usuario.apellidos;
			usuario.dni = dni ?? usuario.dni;
			usuario.email = email ?? usuario.email;
			usuario.telefono = telefono ?? usuario.telefono;
			usuario.direccion = direccion ?? usuario.direccion;
			usuario.password = password ?? usuario.password;
			res.json(usuario);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	});

	// DELETE /api/clientes/:id o /api/admins/:id
	apiRouter.delete(`/${baseRuta}/:id`, (req, res) => {
		const id = parseInt(req.params.id, 10);
		const index = model.usuarios.findIndex(
			(u) => u.id === id && u.rol === rolUpper
		);
		if (index === -1) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}
		model.usuarios.splice(index, 1);
		res.status(204).send();
	});

	// DELETE /api/clientes o /api/admins
	apiRouter.delete(`/${baseRuta}`, (req, res) => {
		model.usuarios = model.usuarios.filter((u) => u.rol !== rolUpper);
		res.status(204).send();
	});
};

// --- Creamos las rutas para ambos roles ---
crearRutasUsuario("CLIENTE");
crearRutasUsuario("ADMIN");

// ===============================================
// RUTAS DEL CARRO (Específicas de Cliente)
// ===============================================
// NOTA: Esto requiere que 'usuario.mjs' defina 'this.carro = []'

// GET /api/clientes/:id/carro
apiRouter.get("/clientes/:id/carro", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const usuario = model.usuarios.find(
		(u) => u.id === id && u.rol === "CLIENTE"
	);
	if (!usuario) {
		return res.status(404).json({ error: "Cliente no encontrado" });
	}
	// Asumimos que el usuario tiene una propiedad 'carro'
	res.json(usuario.carro || []);
});

// POST /api/clientes/:id/carro/items
apiRouter.post("/clientes/:id/carro/items", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const usuario = model.usuarios.find(
		(u) => u.id === id && u.rol === "CLIENTE"
	);
	if (!usuario) {
		return res.status(404).json({ error: "Cliente no encontrado" });
	}
	const item = req.body; // { libroId, cantidad }
	if (!item || !item.libroId || !item.cantidad) {
		return res.status(400).json({ error: "Item inválido" });
	}
	if (!usuario.carro) usuario.carro = []; // Inicializa si no existe
	// Lógica simple de añadir (en P1 es más compleja, con reemplazo)
	usuario.carro.push(item);
	res.status(201).json(item);
});

// PUT /api/clientes/:id/carro/items/:index
apiRouter.put("/clientes/:id/carro/items/:index", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const index = parseInt(req.params.index, 10);
	const usuario = model.usuarios.find(
		(u) => u.id === id && u.rol === "CLIENTE"
	);
	if (!usuario || !usuario.carro || !usuario.carro[index]) {
		return res.status(404).json({ error: "Item de carro no encontrado" });
	}
	const { cantidad } = req.body;
	if (cantidad === undefined) {
		return res.status(400).json({ error: "Cantidad no especificada" });
	}
	usuario.carro[index].cantidad = Number(cantidad);
	res.json(usuario.carro[index]);
});

// ===============================================
// RUTAS DE FACTURAS
// ===============================================

// GET /api/facturas
apiRouter.get("/facturas", (req, res) => {
	const { numero, cliente } = req.query;
	let facturas = [...model.facturas];

	if (numero) {
		facturas = facturas.filter((f) => f.id === parseInt(numero, 10)); // Asumimos 'id' como 'numero'
	}
	if (cliente) {
		facturas = facturas.filter((f) => f.usuarioId === parseInt(cliente, 10));
	}
	res.json(facturas);
});

// POST /api/facturas (facturarCompraCliente)
apiRouter.post("/facturas", (req, res) => {
	try {
		const { items, total, usuarioId, envio } = req.body;
		if (!items || !total || !usuarioId) {
			return res.status(400).json({ error: "Datos de factura incompletos" });
		}
		const nuevaFactura = {
			id: Date.now(), // Usamos timestamp como ID/Numero de factura
			fecha: new Date().toISOString(),
			items,
			total,
			usuarioId,
			envio,
		};
		model.facturas.push(nuevaFactura);

		// --- IMPORTANTE: Vaciar carro y reducir stock ---
		// 1. Reducir stock de libros
		for (const item of items) {
			const libro = model.libros.find((l) => l.id === item.libroId);
			if (libro) {
				try {
					libro.reducirStock(item.cantidad);
				} catch (error) {
					console.warn(
						`Error al reducir stock para libro ${libro.id}: ${error.message}`
					);
				}
			}
		}
		// 2. Vaciar carro del usuario
		const usuario = model.usuarios.find((u) => u.id === usuarioId);
		if (usuario) {
			usuario.carro = [];
		}
		// --- Fin lógica de facturación ---

		res.status(201).json(nuevaFactura);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET /api/facturas/:id
apiRouter.get("/facturas/:id", (req, res) => {
	const id = parseInt(req.params.id, 10);
	const factura = model.facturas.find((f) => f.id === id);
	if (factura) {
		res.json(factura);
	} else {
		res.status(404).json({ error: "Factura no encontrada" });
	}
});

// DELETE /api/facturas
apiRouter.delete("/facturas", (req, res) => {
	model.facturas = [];
	res.status(204).send();
});

// ===============================================
// RUTA CATCH-ALL (DEBE IR AL FINAL)
// ===============================================

// --- Ruta final para la SPA (Igual que P1) ---
// Cualquier GET que no coincida con la API ni con un archivo estático,
// devuelve 'index.html' para que el router del cliente (SPA) se encargue.
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Iniciar servidor (Igual que P1) ---
app.listen(PORT, () => {
	console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
	console.log(`✓ API REST disponible en http://localhost:${PORT}/api`);
});