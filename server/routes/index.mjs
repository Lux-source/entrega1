import { Router } from "express";
import libroRoutes from "./libro-routes.mjs";
import clienteRoutes from "./cliente-routes.mjs";
import adminRoutes from "./admin-routes.mjs";
import facturaRoutes from "./factura-routes.mjs";

const router = Router();

router.use("/libros", libroRoutes);
router.use("/clientes", clienteRoutes);
router.use("/admins", adminRoutes);
router.use("/facturas", facturaRoutes);
router.use("/compras", facturaRoutes); // Alias

export default router;
