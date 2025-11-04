import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";

const templateUrl = new URL("./404.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar error/404.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error-page"><h1>404</h1><p>No se pudo cargar la página.</p></div>';
}

export class Error404 extends Presenter {
	constructor() {
		super(null, "error-404");
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderContent();
	}

	cacheDom() {
		this.homeLink = this.container?.querySelector('[data-element="home-link"]');
	}

	renderContent() {
		const role = session.getRole();
		const normalizedRole = role ?? "invitado";
		const homeUrl =
			normalizedRole === "admin"
				? "/a"
				: normalizedRole === "cliente"
				? "/c"
				: "/";

		if (this.homeLink) {
			this.homeLink.setAttribute("href", homeUrl);
		}
	}
}
