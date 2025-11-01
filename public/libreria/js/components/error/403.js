import { Presenter } from "../../commons/presenter.mjs";
import { session } from "../../commons/libreria-session.mjs";

export class Error403 extends Presenter {
	constructor() {
		super(null, "error-403");
	}

	template() {
		const role = session.getRole();
		const homeUrl = role === "admin" ? "/a" : role === "cliente" ? "/c" : "/";

		return `
            <div class="error-page">
                <div class="error-content">
                    <h1 class="error-code">403</h1>
                    <h2 class="error-title">Acceso Prohibido</h2>
                    <p class="error-message">
                        No tienes permisos para acceder a esta página.
                    </p>
                    <p class="error-detail">
                        Tu rol actual: <strong>${role}</strong>
                    </p>
                    <div class="error-actions">
                        <a href="${homeUrl}" data-link class="btn btn-primary">
                            🏠 Ir a mi inicio
                        </a>
                        ${
													role === "invitado"
														? `
                            <a href="/login" data-link class="btn btn-secondary">
                                🔐 Iniciar sesión
                            </a>
                        `
														: ""
												}
                    </div>
                </div>
                <div class="error-illustration">
                    <span class="error-icon">🚫</span>
                </div>
            </div>
        `;
	}
}
