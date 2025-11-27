const esObjetoPlano = (valor) =>
	valor !== null && typeof valor === "object" && !Array.isArray(valor);

const normalizarEntero = (valor) => {
	if (valor === null || valor === undefined) {
		return null;
	}

	const numero = typeof valor === "number" ? valor : Number.parseInt(valor, 10);
	return Number.isFinite(numero) ? numero : null;
};

const normalizarItem = (item) => {
	if (!item) {
		return null;
	}

	const libroId =
		typeof item.libroId === "number"
			? item.libroId
			: Number.parseInt(item.libroId ?? item.id, 10);
	const cantidad =
		typeof item.cantidad === "number"
			? item.cantidad
			: Number.parseInt(item.cantidad ?? 0, 10);

	if (!Number.isFinite(libroId) || !Number.isFinite(cantidad) || cantidad <= 0) {
		return null;
	}

	return {
		libroId,
		cantidad,
	};
};

const normalizarFechaIso = (valor) => {
	const fecha = valor ? new Date(valor) : new Date();
	return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
};

const normalizarTotal = (valor) => {
	const numero =
		typeof valor === "number" ? valor : Number.parseFloat(valor ?? 0);
	if (!Number.isFinite(numero)) {
		return 0;
	}
	return Math.round(numero * 100) / 100;
};

export class Compra {
	constructor(
		idOrData = null,
		fecha = undefined,
		items = [],
		total = 0,
		usuarioId = null,
		envio = {}
	) {
		const datos = esObjetoPlano(idOrData)
			? idOrData
			: {
					id: idOrData,
					fecha,
					items,
					total,
					usuarioId,
					envio,
			  };

		this.id = normalizarEntero(datos.id);
		this.fecha = normalizarFechaIso(datos.fecha);
		this.items = Array.isArray(datos.items)
			? datos.items.map(normalizarItem).filter(Boolean)
			: [];
		this.total = normalizarTotal(datos.total);
		this.usuarioId = normalizarEntero(datos.usuarioId);
		this.envio = esObjetoPlano(datos.envio) ? { ...datos.envio } : {};
	}

	getId() {
		return this.id;
	}

	getFecha() {
		return this.fecha;
	}

	getItems() {
		return this.items;
	}

	getTotal() {
		return this.total;
	}

	getUsuarioId() {
		return this.usuarioId;
	}

	getEnvio() {
		return this.envio;
	}

	obtenerDetalles() {
		return {
			id: this.id,
			fecha: this.fecha,
			items: this.items.map((item) => ({ ...item })),
			total: this.total,
			usuarioId: this.usuarioId,
			envio: { ...this.envio },
		};
	}
}
