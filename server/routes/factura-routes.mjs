import { Router } from "express";
import { facturaController } from "../controllers/factura-controller.mjs";

const router = Router();

router.get("/", (req, res) => facturaController.obtenerFacturas(req, res));
router.get("/:id", (req, res) => facturaController.obtenerFactura(req, res));
router.post("/", (req, res) => facturaController.crearFactura(req, res));

// Bulk operations
router.put("/", (req, res) => facturaController.reemplazarFacturas(req, res));
router.delete("/", (req, res) => facturaController.eliminarFacturas(req, res));

export default router;
