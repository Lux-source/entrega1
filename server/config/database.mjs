import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/libreria-online";

mongoose.set("strictQuery", false);
export const conectarDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
		});
		console.log("✓ MongoDB conectado exitosamente");
		console.log(`  Base de datos: ${mongoose.connection.name}`);
	} catch (error) {
		console.error("✗ Error al conectar a MongoDB:", error.message);
		throw error;
	}
};

export const desconectarDB = async () => {
	try {
		await mongoose.disconnect();
		console.log("✓ MongoDB desconectado");
	} catch (error) {
		console.error("✗ Error al desconectar de MongoDB:", error.message);
		throw error;
	}
};

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

mongoose.connection.on("connected", () => {
	console.log("Mongoose conectado a MongoDB");
});

mongoose.connection.on("error", (err) => {
	console.error("Error de conexión de Mongoose:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose desconectado de MongoDB");
});

process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("Conexión de Mongoose cerrada por terminación de la aplicación");
	process.exit(0);
});

export default { conectarDB, desconectarDB, limpiarDB };
