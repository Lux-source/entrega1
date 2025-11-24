import { Router } from "express";
import { adminController } from "../controllers/admin-controller.mjs";

const router = Router();

router.get("/", (req, res) => adminController.obtenerAdmins(req, res));
router.get("/:id", (req, res) => adminController.obtenerAdmin(req, res));
router.post("/", (req, res) => adminController.crearAdmin(req, res));
router.put("/:id", (req, res) => adminController.actualizarAdmin(req, res));
router.delete("/:id", (req, res) => adminController.eliminarAdmin(req, res));
router.post("/autenticar", (req, res) => adminController.autenticar(req, res));

// Bulk operations
router.put("/", (req, res) => adminController.reemplazarAdmins(req, res));
router.delete("/", (req, res) => adminController.eliminarAdmins(req, res));

export default router;
