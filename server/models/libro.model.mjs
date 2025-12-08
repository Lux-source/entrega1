import mongoose from "mongoose";

const libroSchema = new mongoose.Schema(
	{
		titulo: {
			type: String,
			required: [true, "El título es obligatorio"],
			trim: true,
			minlength: [1, "El título no puede estar vacío"],
			maxlength: [200, "El título no puede superar los 200 caracteres"],
		},
		autor: {
			type: String,
			required: [true, "El autor es obligatorio"],
			trim: true,
			minlength: [1, "El autor no puede estar vacío"],
			maxlength: [100, "El autor no puede superar los 100 caracteres"],
		},
		isbn: {
			type: String,
			required: [true, "El ISBN es obligatorio"],
			unique: true,
			trim: true,
			validate: {
				validator: function (v) {

					return /^[\d-]+$/.test(v);
				},
				message: "El ISBN debe contener solo números y guiones",
			},
		},
		precio: {
			type: Number,
			required: [true, "El precio es obligatorio"],
			min: [0.01, "El precio debe ser mayor que 0"],
			validate: {
				validator: Number.isFinite,
				message: "El precio debe ser un número válido",
			},
		},
		stock: {
			type: Number,
			required: [true, "El stock es obligatorio"],
			min: [0, "El stock no puede ser negativo"],
			default: 0,
			validate: {
				validator: Number.isInteger,
				message: "El stock debe ser un número entero",
			},
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (doc, ret) {
				if (ret._id) {
					ret.id = ret._id.toString();
					delete ret._id;
				}
				delete ret.__v;
				return ret;
			},
		},
		toObject: {
			virtuals: true,
			transform: function (doc, ret) {
				if (ret._id) {
					ret.id = ret._id.toString();
					delete ret._id;
				}
				delete ret.__v;
				return ret;
			},
		},
	}
);

libroSchema.index({ titulo: 1 });
libroSchema.index({ autor: 1 });
libroSchema.index({ precio: 1 });

libroSchema.methods.reducirStock = function (cantidad) {
	const nuevaCantidad = Number.parseInt(cantidad ?? 0, 10);
	if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
		throw new Error("Cantidad inválida");
	}
	if (nuevaCantidad > (this.stock ?? 0)) {
		throw new Error("Stock insuficiente");
	}
	this.stock -= nuevaCantidad;
	return this.save();
};

libroSchema.methods.actualizarPrecio = function (precio) {
	if (!Number.isFinite(precio) || precio <= 0) {
		throw new Error("El precio debe ser mayor que 0");
	}
	this.precio = precio;
	return this.save();
};

libroSchema.methods.actualizarStock = function (stock) {
	if (!Number.isFinite(stock) || stock < 0) {
		throw new Error("El stock no puede ser negativo");
	}
	this.stock = stock;
	return this.save();
};

libroSchema.statics.buscarPorIsbn = function (isbn) {
	return this.findOne({ isbn });
};

libroSchema.statics.buscarPorTitulo = function (titulo) {
	return this.find({ titulo: new RegExp(titulo, "i") });
};

libroSchema.statics.buscarPorRangoPrecio = function (min, max) {
	const query = {};
	if (min !== undefined) query.precio = { $gte: min };
	if (max !== undefined) query.precio = { ...query.precio, $lte: max };
	return this.find(query);
};

const Libro = mongoose.model("Libro", libroSchema);

export default Libro;
