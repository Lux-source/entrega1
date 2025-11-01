import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";

const templateUrl = new URL("./403.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar error/403.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<div class="error-page"><h1>403</h1><p>No se pudo cargar la página.</p></div>';
}

export class Error403 extends Presenter {
	constructor() {
		super(null, "error-403");
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderContent();
	}

	cacheDom() {
		this.roleEl = this.container?.querySelector('[data-element="role"]');
		this.homeLink = this.container?.querySelector('[data-element="home-link"]');
		this.loginLink = this.container?.querySelector(
			'[data-element="login-link"]'
		);
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

		if (this.roleEl) {
			this.roleEl.textContent = normalizedRole;
		}

		if (this.homeLink) {
			this.homeLink.setAttribute("href", homeUrl);
		}

		if (this.loginLink) {
			if (normalizedRole === "invitado") {
				this.loginLink.style.display = "";
				this.loginLink.setAttribute("href", "/login");
			} else {
				this.loginLink.style.display = "none";
			}
		}
	}
}
