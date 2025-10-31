import { Presenter } from "../../common/presenter.js";
import { router } from "../../common/router.js";
import { session } from "../../common/libreria-session.js";

export class Error404 extends Presenter {
	constructor() {
		super(null, "error-404");
	}

	template() {
		const role = session.getRole();
		const homeUrl = role === "admin" ? "/a" : role === "cliente" ? "/c" : "/";

		return `
            <div class="error-page">
                <div class="error-content">
                    <h1 class="error-code">404</h1>
                    <h2 class="error-title">Página no encontrada</h2>
                    <p class="error-message">
                        Lo sentimos, la página que buscas no existe o ha sido movida.
                    </p>
                    <div class="error-actions">
                        <a href="${homeUrl}" data-link class="btn btn-primary">
                            🏠 Volver al inicio
                        </a>
                        <button id="btn-back" class="btn btn-secondary">
                            ← Volver atrás
                        </button>
                    </div>
                </div>
                <div class="error-illustration">
                    <span class="error-icon">📚❌</span>
                </div>
            </div>
        `;
	}

	bind() {
		const btnBack = this.container.querySelector("#btn-back");
		if (btnBack) {
			btnBack.addEventListener("click", () => {
				window.history.back();
			});
		}
	}
}
