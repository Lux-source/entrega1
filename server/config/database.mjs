import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/libreria-online";

// Configuración de mongoose
mongoose.set("strictQuery", false);

/**
 * Conecta a la base de datos MongoDB
 */
export const conectarDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
		});
		console.log("✓ MongoDB conectado exitosamente");
		console.log(`  Base de datos: ${mongoose.connection.name}`);
	} catch (error) {
		console.error("✗ Error al conectar a MongoDB:", error.message);
		// En producción, podrías querer salir del proceso
		// process.exit(1);
		throw error;
	}
};

/**
 * Desconecta de la base de datos MongoDB
 */
export const desconectarDB = async () => {
	try {
		await mongoose.disconnect();
		console.log("✓ MongoDB desconectado");
	} catch (error) {
		console.error("✗ Error al desconectar de MongoDB:", error.message);
		throw error;
	}
};

/**
 * Limpia todas las colecciones (útil para tests)
 */
export const limpiarDB = async () => {
	try {
		const collections = mongoose.connection.collections;
		for (const key in collections) {
			await collections[key].deleteMany({});
		}
		console.log("✓ Base de datos limpiada");
	} catch (error) {
		console.error("✗ Error al limpiar la base de datos:", error.message);
		throw error;
	}
};

// Manejo de eventos de conexión
mongoose.connection.on("connected", () => {
	console.log("Mongoose conectado a MongoDB");
});

mongoose.connection.on("error", (err) => {
	console.error("Error de conexión de Mongoose:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose desconectado de MongoDB");
});

// Cerrar la conexión si la aplicación termina
process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("Conexión de Mongoose cerrada por terminación de la aplicación");
	process.exit(0);
});

export default { conectarDB, desconectarDB, limpiarDB };
