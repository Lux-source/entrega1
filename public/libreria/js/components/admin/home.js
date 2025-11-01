import { InvitadoHome } from "../invitado/home.js";
import { session } from "../../commons/libreria-session.mjs";

export class AdminHome extends InvitadoHome {
	constructor() {
		super();
		this.name = "admin-home";
	}

	getLibroLink(libro) {
		return `/a/libros/${libro.id}`;
	}

	heroContent() {
		const user = session.getUser();
		const nombre = user?.nombre || "Administrador";
		return `
			<section class="hero admin-hero">
				<h1>Bienvenido, ${nombre}</h1>
				<p>Gestiona el catálogo directamente desde tu panel de administrador.</p>
				<div class="hero-actions">
					<a href="/a/libros/nuevo" data-link class="btn btn-primary">Nuevo Libro</a>
				</div>
			</section>
		`;
	}
}
