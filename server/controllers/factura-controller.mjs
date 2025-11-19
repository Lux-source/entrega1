import { facturaService } from "../services/factura-service.mjs";

const parsearIdNumerico = (valor) => {
	const id = Number.parseInt(valor ?? "", 10);
	return Number.isFinite(id) && id > 0 ? id : null;
};

const serializarFactura = (factura) => ({
	...factura,
	usuarioId: factura?.clienteId ?? null,
});

export class FacturaController {
	async obtenerFacturas(req, res) {
		const { numero, cliente } = req.query ?? {};

		if (numero) {
			const factura = await facturaService.obtenerPorNumero(numero);
			return factura ? res.json([serializarFactura(factura)]) : res.json([]);
		}

		if (cliente) {
			const clienteId = parsearIdNumerico(cliente);
			if (clienteId) {
				const facturas = await facturaService.obtenerPorClienteId(clienteId);
				return res.json(facturas.map(serializarFactura));
			}
		}

		const facturas = await facturaService.obtenerTodas();
		return res.json(facturas.map(serializarFactura));
	}

	async obtenerFactura(req, res) {
		const id = parsearIdNumerico(req.params.id);
		if (!id) return res.status(400).json({ error: "Id no valido" });

		const factura = await facturaService.obtenerPorId(id);
		return factura
			? res.json(serializarFactura(factura))
			: res.status(404).json({ error: "Factura no encontrada" });
	}

	async crearFactura(req, res) {
		if (!Array.isArray(req.body?.items) || !req.body.items.length) {
			return res.status(400).json({ error: "La compra no tiene items" });
		}

		try {
			const factura = await facturaService.crear(req.body);
			return res.status(201).json(serializarFactura(factura));
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async reemplazarFacturas(req, res) {
		if (!Array.isArray(req.body)) {
			return res.status(400).json({ error: "Se espera un array de facturas" });
		}
		try {
			const facturas = await facturaService.reemplazarTodas(req.body);
			return res.json(facturas.map(serializarFactura));
		} catch (error) {
			return res.status(400).json({ error: error.message });
		}
	}

	async eliminarFacturas(req, res) {
		await facturaService.eliminarTodas();
		return res.status(204).end();
	}
}

export const facturaController = new FacturaController();
