import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import passport from "./server/config/passport.mjs";
import routes from "./server/routes/index.mjs";
import { db } from "./server/data/db-context.mjs";

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones con MongoDB store
app.use(
	session({
		secret: process.env.SESSION_SECRET || "libreria-secret-key-dev-2024",
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl:
				process.env.MONGODB_URI || "mongodb://localhost:27017/libreria-online",
			touchAfter: 24 * 3600, // Actualizar sesión cada 24h si no hay cambios
			ttl: parseInt(process.env.SESSION_MAX_AGE) / 1000 || 86400, // TTL en segundos
		}),
		cookie: {
			maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 horas por defecto
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", // HTTPS en producción
		},
	})
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Archivos estáticos
app.use(express.static("public"));
app.use("/test", express.static("test"));

// API Routes
app.use("/api", routes);

// SPA fallback
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Initialize DB and start server
if (process.env.NODE_ENV !== "test") {
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
}

export default app;
