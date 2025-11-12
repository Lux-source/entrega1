import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { model } from "./public/libreria/js/model/seeder.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const serializarCompra = (compra) =>
	typeof compra?.obtenerDetalles === "function"
		? compra.obtenerDetalles()
		: {
				id: compra?.id ?? null,
				fecha: compra?.fecha ?? null,
				items: compra?.items ?? [],
				total: compra?.total ?? 0,
				usuarioId: compra?.usuarioId ?? null,
				envio: compra?.envio ?? {},
		  };

const calcularTotalCompra = (items = []) =>
	items.reduce((sum, item) => {
		const libroId =
			typeof item?.libroId === "number"
				? item.libroId
				: Number.parseInt(item?.libroId ?? item?.id, 10);
		const cantidad =
			typeof item?.cantidad === "number"
				? item.cantidad
				: Number.parseInt(item?.cantidad ?? 0, 10);

		if (
			!Number.isFinite(libroId) ||
			!Number.isFinite(cantidad) ||
			cantidad <= 0
		) {
			return sum;
		}

		const libro = model.libros.find((lib) => lib.id === libroId);
		if (!libro) {
			return sum;
		}

		return sum + libro.precio * cantidad;
	}, 0);

// Middlewares base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/test", express.static("test"));

// API REST para compras
app.get("/api/compras", (req, res) => {
	const compras = model.getCompras().map(serializarCompra);
	res.json(compras);
});

app.get("/api/compras/:id", (req, res) => {
	const id = Number.parseInt(req.params.id, 10);
	if (!Number.isFinite(id)) {
		return res.status(400).json({ error: "Id no valido" });
	}

	const compra = model.getCompra(id);
	if (!compra) {
		return res.status(404).json({ error: "Compra no encontrada" });
	}

	return res.json(serializarCompra(compra));
});

app.post("/api/compras", (req, res) => {
	const payload = req.body;

	if (!payload || !Array.isArray(payload.items) || !payload.items.length) {
		return res
			.status(400)
			.json({ error: "La compra debe incluir al menos un item" });
	}

	const totalCalculado = calcularTotalCompra(payload.items);

	try {
		const compra = model.addCompra({
			...payload,
			total: totalCalculado > 0 ? totalCalculado : payload.total,
		});
		return res.status(201).json(serializarCompra(compra));
	} catch (error) {
		console.error("Error al crear la compra:", error);
		return res.status(500).json({ error: "No se pudo registrar la compra" });
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
