import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import passport from "./server/config/passport.mjs";
import routes from "./server/routes/index.mjs";
import { db } from "./server/data/db-context.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: process.env.SESSION_SECRET || "libreria-secret-key-dev-2024",
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl:
				process.env.MONGODB_URI || "mongodb://localhost:27017/libreria-online",
			touchAfter: 24 * 3600, 
			ttl: parseInt(process.env.SESSION_MAX_AGE) / 1000 || 86400, // TTL 
		}),
		cookie: {
			maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, 
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", 
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.use("/test", express.static("test"));

app.use("/api", routes);

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

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
