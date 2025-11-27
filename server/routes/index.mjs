import { Router } from "express";
import libroRoutes from "./libro-routes.mjs";
import clienteRoutes from "./cliente-routes.mjs";
import adminRoutes from "./admin-routes.mjs";
import facturaRoutes from "./factura-routes.mjs";
import { db } from "../data/db-context.mjs";

const router = Router();

router.use("/libros", libroRoutes);
router.use("/clientes", clienteRoutes);
router.use("/admins", adminRoutes);
router.use("/facturas", facturaRoutes);
router.use("/compras", facturaRoutes); // Alias

router.post("/test/reiniciar", async (req, res) => {
	try {
		await db.reiniciar();
		res.json({ success: true, message: "Base de datos reiniciada" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

export default router;
