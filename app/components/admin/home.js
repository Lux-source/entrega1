import { InvitadoHome } from "../invitado/home.js";
import { session } from "../../common/libreria-session.js";

export class AdminHome extends InvitadoHome {
	constructor() {
		super();
		this.name = "admin-home";
	}

	heroContent() {
		const user = session.getUser();
		const nombre = user?.nombre || "Administrador";
		return `
			<section class="hero admin-hero">
				<h1>Bienvenido, ${nombre}</h1>
				<p>Gestiona el catálogo directamente desde tu panel de administrador.</p>
			</section>
		`;
	}
}
