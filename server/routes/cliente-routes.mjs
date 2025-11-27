import { Router } from "express";
import { clienteController } from "../controllers/cliente-controller.mjs";

const router = Router();

router.get("/", (req, res) => clienteController.obtenerClientes(req, res));
router.get("/:id", (req, res) => clienteController.obtenerCliente(req, res));
router.post("/", (req, res) => clienteController.crearCliente(req, res));
router.put("/:id", (req, res) => clienteController.actualizarCliente(req, res));
router.delete("/:id", (req, res) =>
	clienteController.eliminarCliente(req, res)
);
router.post("/autenticar", (req, res) =>
	clienteController.autenticar(req, res)
);
router.get("/:id/carro", (req, res) =>
	clienteController.obtenerCarro(req, res)
);
router.post("/:id/carro/items", (req, res) =>
	clienteController.agregarItemCarro(req, res)
);
router.put("/:id/carro/items/:index", (req, res) =>
	clienteController.actualizarItemCarro(req, res)
);
router.delete("/:id/carro/items/:index", (req, res) =>
	clienteController.eliminarItemCarro(req, res)
);
router.delete("/:id/carro", (req, res) =>
	clienteController.vaciarCarro(req, res)
);
router.put("/", (req, res) => clienteController.reemplazarClientes(req, res));
router.delete("/", (req, res) => clienteController.eliminarClientes(req, res));

export default router;
