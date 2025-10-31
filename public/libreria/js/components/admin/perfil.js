import { Presenter } from "../../common/presenter.js";
import { session } from "../../common/libreria-session.js";
import { model } from "../../model/index.js";

export class AdminPerfil extends Presenter {
	constructor() {
		super(model, "admin-perfil");
	}

	template() {
		const user = session.getUser();

		return `
            <div class="perfil-container">
                <h1>Mi Perfil</h1>
                
                <div class="perfil-card">
                    <div class="perfil-header">
                        <span class="perfil-icon">👤</span>
                        <div class="perfil-info">
                            <h2>${user.nombre} ${user.apellidos || ""}</h2>
                            <span class="badge badge-admin">Administrador</span>
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
                            <span class="detail-value">${user.direccion}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">#${user.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Rol:</span>
                            <span class="detail-value">${user.rol}</span>
                        </div>
                    </div>

                    <div class="perfil-actions">
                        <a href="/a/modificar-perfil" data-link class="btn btn-primary">
                            Modificar
                        </a>
                    </div>
                </div>
            </div>
        `;
	}
}
