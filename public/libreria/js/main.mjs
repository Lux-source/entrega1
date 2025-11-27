import { router } from "./commons/router.mjs";
import { Navbar } from "./components/layout/navbar.mjs";
import { Messages } from "./components/layout/messages.mjs";
import { InvitadoHome } from "./components/invitado/home.mjs";
import { InvitadoVerLibro } from "./components/invitado/ver-libro.mjs";
import { Login } from "./components/invitado/login.mjs";
import { Registro } from "./components/invitado/registro.mjs";
import { AdminHome } from "./components/admin/home.mjs";
import { AdminVerLibro } from "./components/admin/ver-libro.mjs";
import { AdminLibroForm } from "./components/admin/libro-form.mjs";
import { AdminPerfil } from "./components/admin/perfil.mjs";
import { AdminModificarPerfil } from "./components/admin/modificar-perfil.mjs";
import { ClienteHome } from "./components/cliente/home.mjs";
import { ClienteVerLibro } from "./components/cliente/ver-libro.mjs";
import { ClienteCarro } from "./components/cliente/carro.mjs";
import { ClientePago } from "./components/cliente/pago.mjs";
import { ClienteCompras } from "./components/cliente/compras.mjs";
import { ClientePerfil } from "./components/cliente/perfil.mjs";
import { ClienteModificarPerfil } from "./components/cliente/modificar-perfil.mjs";
import { Error404 } from "./components/error/404.mjs";
import { Error403 } from "./components/error/403.mjs";
router.register("/", InvitadoHome); // Redirige a home de invitado
router.register("/invitado-home", InvitadoHome);
router.register("/libros/:id", InvitadoVerLibro);
router.register("/login", Login);
router.register("/registro", Registro);
router.register("/a", AdminHome, ["admin"]);
router.register("/a/libros/nuevo", AdminLibroForm, ["admin"]);
router.register("/a/libros/:id", AdminVerLibro, ["admin"]);
router.register("/a/libros/editar/:id", AdminLibroForm, ["admin"]);
router.register("/a/perfil", AdminPerfil, ["admin"]);
router.register("/a/modificar-perfil", AdminModificarPerfil, ["admin"]);
router.register("/c", ClienteHome, ["cliente"]);
router.register("/c/libros/:id", ClienteVerLibro, ["cliente"]);
router.register("/c/carro", ClienteCarro, ["cliente"]);
router.register("/c/pago", ClientePago, ["cliente"]);
router.register("/c/compras", ClienteCompras, ["cliente"]);
router.register("/c/perfil", ClientePerfil, ["cliente"]);
router.register("/c/modificar-perfil", ClienteModificarPerfil, ["cliente"]);
router.register("/404", Error404);
router.register("/403", Error403);

const navbar = new Navbar();
const messages = new Messages();

navbar.render();
messages.render();

router.start();
