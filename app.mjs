import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { libraryRepository } from "./server/model/library-repository.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const repo = libraryRepository;

const parseNumericId = (value) => {
	const id = Number.parseInt(value ?? "", 10);
	return Number.isFinite(id) && id > 0 ? id : null;
};

const serializeFactura = (factura) => ({
	...factura,
	usuarioId: factura?.clienteId ?? null,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/test", express.static("test"));

// Libros
app.get("/api/libros", (req, res) => {
	const { isbn, titulo } = req.query ?? {};

	if (isbn) {
		const libro = repo.getLibroPorIsbn(isbn);
		return libro
			? res.json(libro)
			: res.status(404).json({ error: "Libro no encontrado" });
	}

	if (titulo) {
		const libro = repo.getLibroPorTitulo(titulo);
		return libro
			? res.json(libro)
			: res.status(404).json({ error: "Libro no encontrado" });
	}

	return res.json(repo.getLibros());
});

app.get("/api/libros/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const libro = repo.getLibroPorId(id);
	return libro
		? res.json(libro)
		: res.status(404).json({ error: "Libro no encontrado" });
});

app.post("/api/libros", (req, res) => {
	try {
		const libro = repo.addLibro(req.body ?? {});
		return res.status(201).json(libro);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo crear el libro" });
	}
});

app.put("/api/libros/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	try {
		const libro = repo.updateLibro(id, req.body ?? {});
		return libro
			? res.json(libro)
			: res.status(404).json({ error: "Libro no encontrado" });
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo actualizar el libro" });
	}
});

app.delete("/api/libros/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const deleted = repo.removeLibro(id);
	return deleted
		? res.status(204).end()
		: res.status(404).json({ error: "Libro no encontrado" });
});

// Clientes
app.get("/api/clientes", (req, res) => res.json(repo.getClientes()));

app.get("/api/clientes/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const cliente = repo.getClientePorId(id);
	return cliente
		? res.json(cliente)
		: res.status(404).json({ error: "Cliente no encontrado" });
});

app.post("/api/clientes", (req, res) => {
	try {
		const cliente = repo.addCliente(req.body ?? {});
		return res.status(201).json(cliente);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo crear el cliente" });
	}
});

app.put("/api/clientes/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	try {
		const cliente = repo.updateCliente(id, req.body ?? {});
		return cliente
			? res.json(cliente)
			: res.status(404).json({ error: "Cliente no encontrado" });
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo actualizar el cliente" });
	}
});

app.delete("/api/clientes/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const deleted = repo.removeCliente(id);
	return deleted
		? res.status(204).end()
		: res.status(404).json({ error: "Cliente no encontrado" });
});

app.post("/api/clientes/autenticar", (req, res) => {
	try {
		const cliente = repo.autenticarCliente(req.body ?? {});
		return res.json(cliente);
	} catch (error) {
		return res
			.status(401)
			.json({ error: error.message || "Credenciales invalidas" });
	}
});

app.get("/api/clientes/:id/carro", (req, res) => {
	try {
		const id = parseNumericId(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}
		return res.json(repo.getCarroCliente(id));
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo obtener el carro" });
	}
});

app.post("/api/clientes/:id/carro/items", (req, res) => {
	try {
		const id = parseNumericId(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}
		const item = req.body?.item ?? req.body;
		const carro = repo.addClienteCarroItem(id, item ?? {});
		return res.status(201).json(carro);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo actualizar el carro" });
	}
});

app.put("/api/clientes/:id/carro/items/:index", (req, res) => {
	try {
		const id = parseNumericId(req.params.id);
		const indexRaw = Number.parseInt(req.params.index ?? "", 10);
		if (!id || !Number.isFinite(indexRaw) || indexRaw < 0) {
			return res.status(400).json({ error: "Parametros invalidos" });
		}
		const cantidad = req.body?.cant ?? req.body?.cantidad;
		const carro = repo.setClienteCarroItemCantidad(id, indexRaw, cantidad);
		return res.json(carro);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo cambiar la cantidad" });
	}
});

app.delete("/api/clientes/:id/carro/items/:index", (req, res) => {
	try {
		const id = parseNumericId(req.params.id);
		const indexRaw = Number.parseInt(req.params.index ?? "", 10);
		if (!id || !Number.isFinite(indexRaw) || indexRaw < 0) {
			return res.status(400).json({ error: "Parametros invalidos" });
		}
		const carro = repo.removeClienteCarroItem(id, indexRaw);
		return res.json(carro);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo eliminar el item" });
	}
});

app.delete("/api/clientes/:id/carro", (req, res) => {
	try {
		const id = parseNumericId(req.params.id);
		if (!id) {
			return res.status(400).json({ error: "Id no valido" });
		}
		repo.clearClienteCarro(id);
		return res.status(204).end();
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo vaciar el carro" });
	}
});

// Admins
app.get("/api/admins", (req, res) => res.json(repo.getAdmins()));

app.get("/api/admins/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const admin = repo.getAdminPorId(id);
	return admin
		? res.json(admin)
		: res.status(404).json({ error: "Admin no encontrado" });
});

app.post("/api/admins", (req, res) => {
	try {
		const admin = repo.addAdmin(req.body ?? {});
		return res.status(201).json(admin);
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo crear el admin" });
	}
});

app.put("/api/admins/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const admin = repo.updateAdmin(id, req.body ?? {});
	return admin
		? res.json(admin)
		: res.status(404).json({ error: "Admin no encontrado" });
});

app.delete("/api/admins/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const deleted = repo.removeAdmin(id);
	return deleted
		? res.status(204).end()
		: res.status(404).json({ error: "Admin no encontrado" });
});

app.post("/api/admins/autenticar", (req, res) => {
	try {
		const admin = repo.autenticarAdmin(req.body ?? {});
		return res.json(admin);
	} catch (error) {
		return res
			.status(401)
			.json({ error: error.message || "Credenciales invalidas" });
	}
});

// Facturas & Compras (alias)
app.get("/api/facturas", (req, res) => {
	const { numero, cliente } = req.query ?? {};

	if (numero) {
		const factura = repo.getFacturaPorNumero(numero);
		return factura
			? res.json(serializeFactura(factura))
			: res.status(404).json({ error: "Factura no encontrada" });
	}

	if (cliente) {
		const id = parseNumericId(cliente);
		if (!id) {
			return res.status(400).json({ error: "Id de cliente no valido" });
		}
		return res.json(repo.getFacturasPorCliente(id).map(serializeFactura));
	}

	return res.json(repo.getFacturas().map(serializeFactura));
});

app.get("/api/facturas/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const factura = repo.getFacturaPorId(id);
	return factura
		? res.json(serializeFactura(factura))
		: res.status(404).json({ error: "Factura no encontrada" });
});

app.post("/api/facturas", (req, res) => {
	if (!Array.isArray(req.body?.items) || !req.body.items.length) {
		return res.status(400).json({ error: "La factura debe incluir items" });
	}

	try {
		const factura = repo.facturarCompraCliente({
			...req.body,
			clienteId: req.body?.clienteId ?? req.body?.usuarioId ?? null,
		});
		return res.status(201).json(serializeFactura(factura));
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo registrar la factura" });
	}
});

app.get("/api/compras", (req, res) => {
	return res.json(repo.getFacturas().map(serializeFactura));
});

app.get("/api/compras/:id", (req, res) => {
	const id = parseNumericId(req.params.id);
	if (!id) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const factura = repo.getFacturaPorId(id);
	return factura
		? res.json(serializeFactura(factura))
		: res.status(404).json({ error: "Compra no encontrada" });
});

app.post("/api/compras", (req, res) => {
	if (!Array.isArray(req.body?.items) || !req.body.items.length) {
		return res.status(400).json({ error: "La compra debe incluir items" });
	}

	try {
		const factura = repo.facturarCompraCliente({
			...req.body,
			clienteId: req.body?.clienteId ?? req.body?.usuarioId ?? null,
		});
		return res.status(201).json(serializeFactura(factura));
	} catch (error) {
		return res
			.status(400)
			.json({ error: error.message || "No se pudo registrar la compra" });
	}
});

// SPA fallback
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
	console.log("Libreria Online lista para usar");
});
