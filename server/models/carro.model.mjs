import mongoose from "mongoose";

const carroSchema = new mongoose.Schema(
	{
		clienteId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Usuario",
			required: true,
		},
		items: [
			{
				libroId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Libro",
					required: true,
				},
				cantidad: {
					type: Number,
					required: true,
					min: [1, "La cantidad debe ser al menos 1"],
					validate: {
						validator: Number.isInteger,
						message: "La cantidad debe ser un número entero",
					},
				},
			},
		],
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
				if (ret.clienteId) {
					ret.clienteId = ret.clienteId.toString();
				}
				if (ret.items) {
					ret.items = ret.items.map((item) => ({
						libroId: item.libroId ? item.libroId.toString() : item.libroId,
						cantidad: item.cantidad,
					}));
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
				if (ret.clienteId) {
					ret.clienteId = ret.clienteId.toString();
				}
				if (ret.items) {
					ret.items = ret.items.map((item) => ({
						libroId: item.libroId ? item.libroId.toString() : item.libroId,
						cantidad: item.cantidad,
					}));
				}
				delete ret.__v;
				return ret;
			},
		},
	}
);

// Índices
carroSchema.index({ clienteId: 1 }, { unique: true }); // Un carro por cliente

// Métodos de instancia
carroSchema.methods.agregarItem = function (libroId, cantidad = 1) {
	const itemExistente = this.items.find(
		(item) => item.libroId.toString() === libroId.toString()
	);

	if (itemExistente) {
		itemExistente.cantidad += cantidad;
	} else {
		this.items.push({ libroId, cantidad });
	}

	return this.save();
};

carroSchema.methods.actualizarItem = function (index, cantidad) {
	if (index < 0 || index >= this.items.length) {
		throw new Error("Índice de item inválido");
	}

	if (cantidad <= 0) {
		this.items.splice(index, 1);
	} else {
		this.items[index].cantidad = cantidad;
	}

	return this.save();
};

carroSchema.methods.eliminarItem = function (index) {
	if (index < 0 || index >= this.items.length) {
		throw new Error("Índice de item inválido");
	}

	this.items.splice(index, 1);
	return this.save();
};

carroSchema.methods.vaciar = function () {
	this.items = [];
	return this.save();
};

// Métodos estáticos
carroSchema.statics.obtenerPorCliente = async function (clienteId) {
	let carro = await this.findOne({ clienteId }).populate("items.libroId");

	if (!carro) {
		// Crear carro vacío si no existe
		carro = new this({ clienteId, items: [] });
		await carro.save();
	}

	return carro;
};

const Carro = mongoose.model("Carro", carroSchema);

export default Carro;
