export class Usuario {
	constructor(
		id,
		dni,
		nombre,
		apellidos,
		direccion,
		telefono,
		email,
		password,
		rol = "CLIENTE"
	) {
		this.id = id;
		this.dni = dni;
		this.nombre = nombre;
		this.apellidos = apellidos;
		this.direccion = direccion;
		this.telefono = telefono;
		this.email = email;
		this.password = password;
		this.rol = rol.toUpperCase();
	}

	getId() {
		return this.id;
	}

	getDni() {
		return this.dni;
	}

	getNombre() {
		return this.nombre;
	}

	getApellidos() {
		return this.apellidos;
	}

	getEmail() {
		return this.email;
	}

	getRol() {
		return this.rol;
	}

	getTelefono() {
		return this.telefono;
	}

	getDireccion() {
		return this.direccion;
	}
}
