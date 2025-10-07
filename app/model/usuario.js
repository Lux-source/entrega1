export class Usuario {
    constructor(id, nombre, email, password, rol = 'cliente', direccion = '') {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.rol = rol; // 'cliente' | 'admin'
        this.direccion = direccion;
    }

    getId() { return this.id; }
    getNombre() { return this.nombre; }
    getEmail() { return this.email; }
    getRol() { return this.rol; }
}