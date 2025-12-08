import { usuarioService } from "../services/usuario-service.mjs";
import mongoose from "mongoose";

const validarObjectId = (valor) => {
	return mongoose.Types.ObjectId.isValid(valor) ? valor : null;
};

export class AdminController {
	async obtenerAdmins(req, res) {
		const { email, dni } = req.query ?? {};

		if (email) {
			const admin = await usuarioService.obtenerAdminPorEmail(email);
			return admin ? res.json([admin]) : res.json([]);
		}

		if (dni) {
			const admin = await usuarioService.obtenerAdminPorDni(dni);
			return admin ? res.json([admin]) : res.json([]);
		}

		return res.json(await usuarioService.obtenerTodosAdmins());
	}

	async obtenerAdmin(req, res) {
		const id = validarObjectId(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		const admin = await usuarioService.obtenerAdminPorId(id);
		return admin
			? res.json(admin)
			: res.status(404).json({ error: "Admin no encontrado" });
	}

	async crearAdmin(req, res) {
		try {
			const admin = await usuarioService.crearAdmin(req.body ?? {});
			return res.status(201).json(admin);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async actualizarAdmin(req, res) {
		const id = validarObjectId(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		try {
			const admin = await usuarioService.actualizarAdmin(id, req.body ?? {});
			return admin
				? res.json(admin)
				: res.status(404).json({ error: "Admin no encontrado" });
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarAdmin(req, res) {
		const id = validarObjectId(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		const eliminado = await usuarioService.eliminarAdmin(id);
		return eliminado
			? res.status(204).end()
			: res.status(404).json({ error: "Admin no encontrado" });
	}

	async autenticar(req, res) {
		try {
			const { email, password } = req.body;
			const admin = await usuarioService.autenticarAdmin(email, password);
			return res.json(admin);
		} catch (error) {
			return res.status(401).json({ error: error.message });
		}
	}

	async reemplazarAdmins(req, res) {
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ error: "Se espera un array de admins" });
		}
		try {
			const admins = await usuarioService.reemplazarTodosAdmins(req.body);
			return res.json(admins);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarAdmins(req, res) {
		await usuarioService.eliminarTodosAdmins();
		return res.status(204).end();
	}
}

export const adminController = new AdminController();
