import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./server/routes/index.mjs";
import { db } from "./server/data/db-context.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/test", express.static("test"));

// API Routes
app.use("/api", routes);

// SPA fallback
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Initialize DB and start server
db.iniciar()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Servidor corriendo en http://localhost:${PORT}`);
			console.log("Libreria Online lista para usar");
		});
	})
	.catch((err) => {
		console.error("Error al iniciar la base de datos:", err);
		process.exit(1);
	});
