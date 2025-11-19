import { usuarioService } from "../services/usuario-service.mjs";

const parsearIdNumerico = (valor) => {
	const id = Number.parseInt(valor ?? "", 10);
	return Number.isFinite(id) && id > 0 ? id : null;
};

export class ClienteController {
	async obtenerClientes(req, res) {
		const { email, dni } = req.query ?? {};

		if (email) {
			const cliente = await usuarioService.obtenerClientePorEmail(email);
			return cliente ? res.json([cliente]) : res.json([]);
		}

		if (dni) {
			const cliente = await usuarioService.obtenerClientePorDni(dni);
			return cliente ? res.json([cliente]) : res.json([]);
		}

		return res.json(await usuarioService.obtenerTodosClientes());
	}

	async obtenerCliente(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		const cliente = await usuarioService.obtenerClientePorId(id);
		return cliente
			? res.json(cliente)
			: res.status(404).json({ error: "Cliente no encontrado" });
	}

	async crearCliente(req, res) {
		try {
			const cliente = await usuarioService.crearCliente(req.body ?? {});
			return res.status(201).json(cliente);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async actualizarCliente(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		try {
			const cliente = await usuarioService.actualizarCliente(
				id,
				req.body ?? {}
			);
			return cliente
				? res.json(cliente)
				: res.status(404).json({ error: "Cliente no encontrado" });
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarCliente(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		const eliminado = await usuarioService.eliminarCliente(id);
		return eliminado
			? res.status(204).end()
			: res.status(404).json({ error: "Cliente no encontrado" });
	}

	async autenticar(req, res) {
		try {
			const { email, password } = req.body;
			const cliente = await usuarioService.autenticarCliente(email, password);
			return res.json(cliente);
		} catch (error) {
			return res.status(401).json({ error: error.message });
		}
	}

	async reemplazarClientes(req, res) {
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ error: "Se espera un array de clientes" });
		}
		try {
			const clientes = await usuarioService.reemplazarTodosClientes(req.body);
			return res.json(clientes);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarClientes(req, res) {
		await usuarioService.eliminarTodosClientes();
		return res.status(204).end();
	}

	// Carro
	async obtenerCarro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		try {
			const carro = await usuarioService.obtenerCarro(id);
			return res.json(carro);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async agregarItemCarro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		try {
			const item = req.body.item || req.body;
			const carro = await usuarioService.agregarItemCarro(id, item);
			return res.status(201).json(carro);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async actualizarItemCarro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		const idx = parseInt(req.params.index, 10);

		if (!id) return res.status(400).json({ error: "Id no valido" });
		if (isNaN(idx) || idx < 0)
			return res.status(400).json({ error: "Indice no valido" });

		try {
			const cantidad = req.body.cantidad ?? req.body.cant;
			const carro = await usuarioService.actualizarItemCarro(id, idx, cantidad);
			return res.json(carro);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarItemCarro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		const idx = parseInt(req.params.index, 10);

		if (!id) return res.status(400).json({ error: "Id no valido" });
		if (isNaN(idx) || idx < 0)
			return res.status(400).json({ error: "Indice no valido" });

		try {
			const carro = await usuarioService.eliminarItemCarro(id, idx);
			return res.json(carro);
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async vaciarCarro(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		try {
			await usuarioService.vaciarCarro(id);
			return res.status(204).end();
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}
}

export const clienteController = new ClienteController();
