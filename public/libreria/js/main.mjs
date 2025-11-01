import { router } from "./commons/router.mjs";
import { Navbar } from "./components/layout/navbar.js";
import { Messages } from "./components/layout/messages.js";

// Invitado
import { InvitadoHome } from "./components/invitado/home.js";
import { InvitadoVerLibro } from "./components/invitado/ver-libro.js";
import { Login } from "./components/invitado/login.js";
import { Registro } from "./components/invitado/registro.js";

// Admin
import { AdminHome } from "./components/admin/home.js";
import { AdminVerLibro } from "./components/admin/ver-libro.js";
import { AdminLibroForm } from "./components/admin/libro-form.js";
import { AdminPerfil } from "./components/admin/perfil.js";
import { AdminModificarPerfil } from "./components/admin/modificar-perfil.js";

// Cliente
import { ClienteHome } from "./components/cliente/home.js";
import { ClienteVerLibro } from "./components/cliente/ver-libro.js";
import { ClienteCarro } from "./components/cliente/carro.js";
import { ClientePago } from "./components/cliente/pago.js";
import { ClienteCompras } from "./components/cliente/compras.js";
import { ClientePerfil } from "./components/cliente/perfil.js";
import { ClienteModificarPerfil } from "./components/cliente/modificar-perfil.js";

// Páginas de error
import { Error404 } from "./components/error/404.js";
import { Error403 } from "./components/error/403.js";

// ==================== RUTAS INVITADO ====================
router.register("/", InvitadoHome); // Redirige a home de invitado
router.register("/invitado-home", InvitadoHome);
router.register("/libros/:id", InvitadoVerLibro);
router.register("/login", Login);
router.register("/registro", Registro);

// ==================== RUTAS ADMIN ====================
router.register("/a", AdminHome, ["admin"]);
router.register("/a/libros/nuevo", AdminLibroForm, ["admin"]);
router.register("/a/libros/:id", AdminVerLibro, ["admin"]);
router.register("/a/libros/editar/:id", AdminLibroForm, ["admin"]);
router.register("/a/perfil", AdminPerfil, ["admin"]);
router.register("/a/modificar-perfil", AdminModificarPerfil, ["admin"]);

// ==================== RUTAS CLIENTE ====================
router.register("/c", ClienteHome, ["cliente"]);
router.register("/c/libros/:id", ClienteVerLibro, ["cliente"]);
router.register("/c/carro", ClienteCarro, ["cliente"]);
router.register("/c/pago", ClientePago, ["cliente"]);
router.register("/c/compras", ClienteCompras, ["cliente"]);
router.register("/c/perfil", ClientePerfil, ["cliente"]);
router.register("/c/modificar-perfil", ClienteModificarPerfil, ["cliente"]);

// ==================== RUTAS DE ERROR ====================
router.register("/404", Error404);
router.register("/403", Error403);

// Inicializar layout
const navbar = new Navbar();
const messages = new Messages();

navbar.render();
messages.render();

// Escuchar cambios para re-renderizar navbar (ya se hace en Navbar con auth-store)
window.addEventListener("user-logged-in", () => {
	navbar.render();
	messages.render();
});

window.addEventListener("user-logged-out", () => {
	navbar.render();
	messages.render();
});

// Iniciar router
router.start();
