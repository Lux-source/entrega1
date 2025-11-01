import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { session } from "../../commons/libreria-session.mjs";

export class ClientePerfil extends Presenter {
	constructor() {
		super(null, "cliente-perfil");
	}

	template() {
		const user = session.getUser();
		if (!user) {
			session.pushError("Sesión no encontrada. Inicia sesión nuevamente.");
			router.navigate("/login");
			return "";
		}

		const compras = JSON.parse(localStorage.getItem("compras") || "[]");
		const totalCompras = compras.length;
		const totalGastado = compras.reduce(
			(sum, compra) => sum + (compra.total || 0),
			0
		);

		return `
        <div class="perfil-container">
            <h1>Mi Perfil</h1>
            <div class="perfil-card">
                <div class="perfil-header">
                    <span class="perfil-icon">👤</span>
                    <div class="perfil-info">
                        <h2>${user.nombre} ${user.apellidos || ""}</h2>
                        <span class="badge badge-cliente">Cliente</span>
                    </div>
                </div>
                <div class="perfil-details">
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${user.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">DNI:</span>
                        <span class="detail-value">${user.dni}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Teléfono:</span>
                        <span class="detail-value">${user.telefono}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dirección:</span>
                        <span class="detail-value">${
													user.direccion || "No especificada"
												}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ID Cliente:</span>
                        <span class="detail-value">#${user.id}</span>
                    </div>
                </div>
                <div class="perfil-stats">
                    <div class="stat-item">
                        <span class="stat-number">${totalCompras}</span>
                        <span class="stat-label">Compras Realizadas</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalGastado.toFixed(
													2
												)}€</span>
                        <span class="stat-label">Total Gastado</span>
                    </div>
                </div>
                <div class="perfil-actions">
                    <a href="/c/modificar-perfil" data-link class="btn btn-primary">Modificar Perfil</a>
                </div>
            </div>
        </div>
        `;
	}
}
