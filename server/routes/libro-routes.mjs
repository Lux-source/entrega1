import { Router } from "express";
import { libroController } from "../controllers/libro-controller.mjs";

const router = Router();

router.get("/", (req, res) => libroController.obtenerLibros(req, res));
router.get("/:id", (req, res) => libroController.obtenerLibro(req, res));
router.post("/", (req, res) => libroController.crearLibro(req, res));
router.put("/:id", (req, res) => libroController.actualizarLibro(req, res));
router.delete("/:id", (req, res) => libroController.eliminarLibro(req, res));
router.put("/", (req, res) => libroController.reemplazarLibros(req, res));
router.delete("/", (req, res) => libroController.eliminarLibros(req, res));

export default router;
