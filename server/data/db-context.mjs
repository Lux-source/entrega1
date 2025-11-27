import mongoose from "mongoose";
import { conectarDB } from "../config/database.mjs";
import { Libro, Usuario, Carro, Factura } from "../models/index.mjs";

const ROL = {
	ADMIN: "ADMIN",
	CLIENTE: "CLIENTE",
};

class DbContexto {
	constructor() {
		this.cargado = false;
	}

	async iniciar() {
		try {
			await conectarDB();
			this.cargado = true;

			// Verificar si la base de datos está vacía y poblar con datos seed
			const cantidadLibros = await Libro.countDocuments();
			if (cantidadLibros === 0) {
				console.log("Base de datos vacía, poblando con datos iniciales...");
				await this.semilla();
			}
		} catch (error) {
			console.error("Error al iniciar la base de datos:", error);
			throw error;
		}
	}

	async guardar() {
		// No es necesario con Mongoose, los cambios se guardan automáticamente
		// Mantenemos el método por compatibilidad con la API existente
		return Promise.resolve();
	}

	async semilla() {
		console.log("Creando datos de semilla...");

		// Limpiar colecciones existentes
		await Usuario.deleteMany({});
		await Libro.deleteMany({});
		await Carro.deleteMany({});
		await Factura.deleteMany({});

		// Crear Admin
		const admin = await Usuario.create({
			dni: "00000000A",
			nombre: "Admin",
			apellidos: "Principal",
			direccion: "Calle Libreria 1",
			telefono: "600000000",
			email: "admin@libreria.com",
			password: "Admin123",
			rol: ROL.ADMIN,
		});

		// Crear Clientes
		const cliente1 = await Usuario.create({
			dni: "11111111B",
			nombre: "Juan",
			apellidos: "Perez",
			direccion: "Calle Mayor 1",
			telefono: "600000001",
			email: "juan@mail.com",
			password: "Juanperez123",
			rol: ROL.CLIENTE,
		});

		const cliente2 = await Usuario.create({
			dni: "22222222C",
			nombre: "Maria",
			apellidos: "Garcia",
			direccion: "Av. Libertad 23",
			telefono: "600000002",
			email: "maria@mail.com",
			password: "Maria123",
			rol: ROL.CLIENTE,
		});

		// Crear Libros
		const libro1 = await Libro.create({
			titulo: "Libro 1",
			autor: "Lucian",
			isbn: "978-84-376-0494-7",
			precio: 15.95,
			stock: 25,
		});

		const libro2 = await Libro.create({
			titulo: "Libro 2",
			autor: "Loren",
			isbn: "978-84-204-2548-8",
			precio: 18.9,
			stock: 15,
		});

		const libro3 = await Libro.create({
			titulo: "Libro 3",
			autor: "Juanpi",
			isbn: "978-84-9759-252-5",
			precio: 12.5,
			stock: 30,
		});

		const libro4 = await Libro.create({
			titulo: "Libro 4",
			autor: "Hector",
			isbn: "978-84-9841-483-8",
			precio: 9.95,
			stock: 50,
		});

		// Crear Facturas de ejemplo
		const factura1 = await Factura.create({
			numero: "FAC-0001",
			fecha: new Date(),
			clienteId: cliente1._id,
			items: [
				{ libroId: libro1._id, cantidad: 1 },
				{ libroId: libro3._id, cantidad: 2 },
			],
			total: libro1.precio * 1 + libro3.precio * 2,
			envio: {
				nombre: "Juan Perez",
				direccion: "Calle Mayor 1",
				ciudad: "Madrid",
				cp: "28001",
				telefono: "600000001",
			},
		});

		const factura2 = await Factura.create({
			numero: "FAC-0002",
			fecha: new Date(),
			clienteId: cliente2._id,
			items: [
				{ libroId: libro2._id, cantidad: 1 },
				{ libroId: libro4._id, cantidad: 3 },
			],
			total: libro2.precio * 1 + libro4.precio * 3,
			envio: {
				nombre: "Maria Garcia",
				direccion: "Av. Libertad 23",
				ciudad: "Valencia",
				cp: "46001",
				telefono: "600000002",
			},
		});

		// Reducir stock según las facturas
		libro1.stock -= 1;
		await libro1.save();

		libro3.stock -= 2;
		await libro3.save();

		libro2.stock -= 1;
		await libro2.save();

		libro4.stock -= 3;
		await libro4.save();

		console.log("✓ Datos de semilla creados exitosamente");
		this.cargado = true;
	}

	// Mapeo de nombres de colección a modelos Mongoose
	_obtenerModelo(coleccion) {
		const modelos = {
			libros: Libro,
			clientes: Usuario,
			admins: Usuario,
			facturas: Factura,
		};
		return modelos[coleccion];
	}

	async obtenerTodos(coleccion) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Filtrar por rol si es usuarios
		if (coleccion === "clientes") {
			return await Usuario.find({ rol: "CLIENTE" }).lean();
		}
		if (coleccion === "admins") {
			return await Usuario.find({ rol: "ADMIN" }).lean();
		}

		return await Modelo.find().lean();
	}

	async guardarTodos(coleccion, datos) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Borrar todos los documentos existentes
		if (coleccion === "clientes") {
			await Usuario.deleteMany({ rol: "CLIENTE" });
		} else if (coleccion === "admins") {
			await Usuario.deleteMany({ rol: "ADMIN" });
		} else {
			await Modelo.deleteMany({});
		}

		// Insertar nuevos datos
		if (datos && datos.length > 0) {
			// Transformar IDs si vienen como strings
			const datosTransformados = datos.map((item) => {
				const nuevoItem = { ...item };
				delete nuevoItem.id; // Mongoose creará _id automáticamente
				return nuevoItem;
			});
			await Modelo.insertMany(datosTransformados);
		}
	}

	async obtener(coleccion, id) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null;
		}

		const filtro = { _id: id };

		// Filtrar por rol si es usuarios
		if (coleccion === "clientes") {
			filtro.rol = "CLIENTE";
		} else if (coleccion === "admins") {
			filtro.rol = "ADMIN";
		}

		return await Modelo.findOne(filtro).lean();
	}

	async agregar(coleccion, item) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Asegurar que tiene el rol correcto
		if (coleccion === "clientes") {
			item.rol = "CLIENTE";
		} else if (coleccion === "admins") {
			item.rol = "ADMIN";
		}

		// Eliminar id si existe (Mongoose crea _id automáticamente)
		const { id, ...itemSinId } = item;

		const documento = new Modelo(itemSinId);
		await documento.save();
		return documento.toJSON();
	}

	async actualizar(coleccion, id, actualizaciones) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null;
		}

		const filtro = { _id: id };

		// Filtrar por rol si es usuarios
		if (coleccion === "clientes") {
			filtro.rol = "CLIENTE";
		} else if (coleccion === "admins") {
			filtro.rol = "ADMIN";
		}

		// No permitir cambiar rol
		delete actualizaciones.rol;
		delete actualizaciones.id;
		delete actualizaciones._id;

		const documento = await Modelo.findOneAndUpdate(filtro, actualizaciones, {
			new: true,
			runValidators: true,
		}).lean();

		return documento;
	}

	async eliminar(coleccion, id) {
		if (!this.cargado) await this.iniciar();

		const Modelo = this._obtenerModelo(coleccion);
		if (!Modelo) {
			throw new Error(`Colección desconocida: ${coleccion}`);
		}

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return false;
		}

		const filtro = { _id: id };

		// Filtrar por rol si es usuarios
		if (coleccion === "clientes") {
			filtro.rol = "CLIENTE";
			// Eliminar también el carro del cliente
			await Carro.deleteOne({ clienteId: id });
		} else if (coleccion === "admins") {
			filtro.rol = "ADMIN";
		}

		const resultado = await Modelo.deleteOne(filtro);
		return resultado.deletedCount > 0;
	}

	// Específico para carros
	async obtenerCarro(clienteId) {
		if (!this.cargado) await this.iniciar();

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(clienteId)) {
			return [];
		}

		const carro = await Carro.obtenerPorCliente(clienteId);
		return carro.items || [];
	}

	async guardarCarro(clienteId, items) {
		if (!this.cargado) await this.iniciar();

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(clienteId)) {
			throw new Error("ID de cliente inválido");
		}

		let carro = await Carro.findOne({ clienteId });

		if (!carro) {
			carro = new Carro({ clienteId, items });
		} else {
			carro.items = items;
		}

		await carro.save();
		return carro.items;
	}

	async eliminarCarro(clienteId) {
		if (!this.cargado) await this.iniciar();

		// Validar ObjectId
		if (!mongoose.Types.ObjectId.isValid(clienteId)) {
			return;
		}

		await Carro.deleteOne({ clienteId });
	}

	async reiniciar() {
		await this.semilla();
	}
}

export const db = new DbContexto();
