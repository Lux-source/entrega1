import mongoose from "mongoose";

const facturaSchema = new mongoose.Schema(
	{
		numero: {
			type: String,
			required: true,
			trim: true,
		},
		fecha: {
			type: Date,
			required: true,
			default: Date.now,
		},
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
		total: {
			type: Number,
			required: true,
			min: [0, "El total no puede ser negativo"],
		},
		envio: {
			nombre: {
				type: String,
				required: true,
				trim: true,
			},
			direccion: {
				type: String,
				required: true,
				trim: true,
			},
			ciudad: {
				type: String,
				required: true,
				trim: true,
			},
			cp: {
				type: String,
				required: true,
				trim: true,
			},
			telefono: {
				type: String,
				required: true,
				trim: true,
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
				if (ret.clienteId) {
					ret.clienteId = ret.clienteId.toString();
				}
				if (ret.items) {
					ret.items = ret.items.map((item) => ({
						libroId: item.libroId ? item.libroId.toString() : item.libroId,
						cantidad: item.cantidad,
					}));
				}
				// Convertir fecha a ISO string para compatibilidad
				if (ret.fecha instanceof Date) {
					ret.fecha = ret.fecha.toISOString();
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
				if (ret.fecha instanceof Date) {
					ret.fecha = ret.fecha.toISOString();
				}
				delete ret.__v;
				return ret;
			},
		},
	}
);

// Índices
facturaSchema.index({ numero: 1 }, { unique: true }); // Número de factura único
facturaSchema.index({ clienteId: 1 });
facturaSchema.index({ fecha: -1 }); // Ordenar por fecha descendente

// Métodos estáticos
facturaSchema.statics.generarNumeroFactura = async function () {
	const ultimaFactura = await this.findOne().sort({ numero: -1 }).limit(1);

	if (!ultimaFactura) {
		return "FAC-0001";
	}

	// Extraer número de "FAC-0001" -> 1
	const match = ultimaFactura.numero.match(/FAC-(\d+)/);
	if (!match) {
		return "FAC-0001";
	}

	const ultimoNumero = parseInt(match[1], 10);
	const nuevoNumero = (ultimoNumero + 1).toString().padStart(4, "0");
	return `FAC-${nuevoNumero}`;
};

facturaSchema.statics.buscarPorNumero = function (numero) {
	return this.findOne({ numero });
};

facturaSchema.statics.buscarPorCliente = function (clienteId) {
	return this.find({ clienteId }).sort({ fecha: -1 });
};

const Factura = mongoose.model("Factura", facturaSchema);

export default Factura;
