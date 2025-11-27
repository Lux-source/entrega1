import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const usuarioSchema = new mongoose.Schema(
	{
		dni: {
			type: String,
			required: [true, "El DNI es obligatorio"],
			trim: true,
			validate: {
				validator: function (v) {
					// Formato: 7-8 dígitos seguidos de una letra mayúscula
					return /^[0-9]{7,8}[A-Z]$/.test(v);
				},
				message:
					"El DNI debe tener 7-8 dígitos seguidos de una letra mayúscula",
			},
		},
		nombre: {
			type: String,
			required: [true, "El nombre es obligatorio"],
			trim: true,
			minlength: [1, "El nombre no puede estar vacío"],
			maxlength: [100, "El nombre no puede superar los 100 caracteres"],
		},
		apellidos: {
			type: String,
			required: [true, "Los apellidos son obligatorios"],
			trim: true,
			minlength: [1, "Los apellidos no pueden estar vacíos"],
			maxlength: [100, "Los apellidos no pueden superar los 100 caracteres"],
		},
		direccion: {
			type: String,
			required: [true, "La dirección es obligatoria"],
			trim: true,
			minlength: [1, "La dirección no puede estar vacía"],
			maxlength: [200, "La dirección no puede superar los 200 caracteres"],
		},
		telefono: {
			type: String,
			required: [true, "El teléfono es obligatorio"],
			trim: true,
			validate: {
				validator: function (v) {
					// 7-15 dígitos
					return /^[0-9]{7,15}$/.test(v);
				},
				message: "El teléfono debe tener entre 7 y 15 dígitos",
			},
		},
		email: {
			type: String,
			required: [true, "El email es obligatorio"],
			trim: true,
			lowercase: true,
			validate: {
				validator: function (v) {
					return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
				},
				message: "El email no tiene un formato válido",
			},
		},
		password: {
			type: String,
			required: [true, "La contraseña es obligatoria"],
			minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
		},
		rol: {
			type: String,
			required: true,
			enum: {
				values: ["ADMIN", "CLIENTE"],
				message: "El rol debe ser ADMIN o CLIENTE",
			},
			uppercase: true,
			default: "CLIENTE",
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
				delete ret.password; // No incluir password en respuestas JSON
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

// Índices compuestos: email y dni deben ser únicos por rol
usuarioSchema.index({ email: 1, rol: 1 }, { unique: true });
usuarioSchema.index({ dni: 1, rol: 1 }, { unique: true });

// Middleware pre-save: hashear contraseña si fue modificada
usuarioSchema.pre("save", async function (next) {
	// Solo hashear si la contraseña fue modificada (o es nueva)
	if (!this.isModified("password")) {
		return next();
	}

	try {
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Método de instancia: comparar contraseña
usuarioSchema.methods.compararPassword = async function (passwordCandidata) {
	try {
		return await bcrypt.compare(passwordCandidata, this.password);
	} catch (error) {
		throw new Error("Error al comparar contraseñas");
	}
};

// Métodos estáticos
usuarioSchema.statics.buscarPorEmail = function (email, rol) {
	const query = { email: email.toLowerCase() };
	if (rol) query.rol = rol.toUpperCase();
	return this.findOne(query);
};

usuarioSchema.statics.buscarPorDni = function (dni, rol) {
	const query = { dni: dni.toUpperCase() };
	if (rol) query.rol = rol.toUpperCase();
	return this.findOne(query);
};

usuarioSchema.statics.autenticar = async function (email, password, rol) {
	const usuario = await this.buscarPorEmail(email, rol);
	if (!usuario) {
		return null;
	}

	const esValida = await usuario.compararPassword(password);
	if (!esValida) {
		return null;
	}

	return usuario;
};

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;
