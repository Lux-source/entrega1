import { session } from "./libreria-session.mjs";

class Router {
	constructor() {
		this.routes = {};
		this.currentComponent = null;

		window.addEventListener("popstate", () => this.handleRoute());
		document.addEventListener("click", (event) => {
			if (event.target.matches("[data-link]")) {
				event.preventDefault();
				this.navigate(event.target.getAttribute("href"));
			}
		});
	}

	register(path, componentClass, guard = null) {
		this.routes[path] = { componentClass, guard };
	}

	navigate(path, state = {}) {
		history.pushState(state, "", path);
		this.handleRoute();
	}

	async handleRoute() {
		const path = window.location.pathname;
		let route = this.routes[path];

		// Rutas como /libros/:id
		if (!route) {
			const dynamicRoute = Object.keys(this.routes).find((routePath) => {
				const pattern = routePath.replace(/:\w+/g, "([^/]+)");
				return new RegExp(`^${pattern}$`).test(path);
			});
			if (dynamicRoute) route = this.routes[dynamicRoute];
		}

		if (!route) {
			this.navigate("/404");
			return;
		}

		// Guard de rol
		if (route.guard) {
			const role = session.getRole();
			if (!route.guard.includes(role)) {
				session.pushError("No tienes permiso para acceder a esta página");
				this.navigate(role === "invitado" ? "/" : `/${role.charAt(0)}`);
				return;
			}
		}

		// Desmontar componente anterior y montar el nuevo
		if (this.currentComponent) {
			this.currentComponent.desmontar();
		}

		const Component = route.componentClass;
		this.currentComponent = new Component();
		this.currentComponent.render();
	}

	start() {
		this.handleRoute();
	}
}

export const router = new Router();
