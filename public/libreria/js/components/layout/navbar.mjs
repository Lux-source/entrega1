import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";
import { router } from "../../commons/router.mjs";
import { authStore } from "../../model/auth-store.js";

const templateUrl = new URL("./navbar.html", import.meta.url);
let templateHtml = "";

try {
	const response = await fetch(templateUrl);
	if (!response.ok) {
		throw new Error(`Error ${response.status} al cargar layout/navbar.html`);
	}
	templateHtml = await response.text();
} catch (error) {
	console.error(error);
	templateHtml =
		'<nav class="navbar"><div class="navbar-brand">Librería Online</div></nav>';
}

export class Navbar extends Presenter {
	constructor() {
		super(null, "navbar", "navbar");
		this.onAuthChange = this.onAuthChange.bind(this);
		this.onLogoutClick = this.onLogoutClick.bind(this);
		this.logoutButton = null;

		authStore.subscribe(this.onAuthChange);
		window.addEventListener("user-logged-in", this.onAuthChange);
		window.addEventListener("user-logged-out", this.onAuthChange);
	}

	template() {
		return templateHtml;
	}

	bind() {
		this.cacheDom();
		this.renderNavbar();
	}

	cacheDom() {
		this.containerEl = this.container;
		this.navbarEl = this.container?.querySelector('[data-element="navbar"]');
		this.menuEl = this.container?.querySelector('[data-element="menu"]');
		this.userEl = this.container?.querySelector('[data-element="user"]');
	}

	renderNavbar() {
		if (!this.menuEl) {
			return;
		}

		if (this.logoutButton) {
			this.logoutButton.removeEventListener("click", this.onLogoutClick);
			this.logoutButton = null;
		}

		const role = session.getRole();
		const user = session.getUser();

		let menuHtml = "";

		switch (role) {
			case "invitado":
				menuHtml = `
                        <a href="/invitado-home" data-link>Inicio</a>
                        <a href="/login" data-link>Iniciar Sesión</a>
                        <a href="/registro" data-link>Registrarse</a>
                    `;
				break;
			case "cliente":
				menuHtml = `
                        <a href="/c" data-link>Mi Inicio</a>
                        <a href="/c/carro" data-link>Carro</a>
                        <a href="/c/compras" data-link>Mis Compras</a>
                        <a href="/c/perfil" data-link>Perfil</a>
                        <button type="button" data-element="logout-button">Cerrar Sesión</button>
                    `;
				break;
			case "admin":
				menuHtml = `
                        <a href="/a" data-link>Inicio</a>
                        <a href="/a/perfil" data-link>Perfil</a>
                        <button type="button" data-element="logout-button">Cerrar Sesión</button>
                    `;
				break;
			default:
				menuHtml = `
                        <a href="/" data-link>Inicio</a>
                        <a href="/login" data-link>Iniciar Sesión</a>
                    `;
		}

		this.menuEl.innerHTML = menuHtml;

		this.logoutButton = this.menuEl.querySelector(
			'[data-element="logout-button"]'
		);
		if (this.logoutButton) {
			this.logoutButton.addEventListener("click", this.onLogoutClick);
		}

		this.renderUser(user);
	}

	renderUser(user) {
		if (!this.userEl) {
			return;
		}

		if (user) {
			this.userEl.textContent = `👤 ${user.nombre ?? ""}`.trim();
			this.userEl.style.display = "";
		} else {
			this.userEl.textContent = "";
			this.userEl.style.display = "none";
		}
	}

	onLogoutClick() {
		session.clearUser();
		authStore.setLogout();
		session.pushSuccess("Sesión cerrada");
		router.navigate("/");
		window.dispatchEvent(new CustomEvent("user-logged-out"));
	}

	onAuthChange() {
		this.render();
	}

	unmount() {
		authStore.unsubscribe(this.onAuthChange);
		window.removeEventListener("user-logged-in", this.onAuthChange);
		window.removeEventListener("user-logged-out", this.onAuthChange);

		if (this.logoutButton) {
			this.logoutButton.removeEventListener("click", this.onLogoutClick);
			this.logoutButton = null;
		}

		super.unmount();
	}
}
