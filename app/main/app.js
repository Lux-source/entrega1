import { router } from '../common/router.js';
import { Navbar } from '../components/layout/navbar.js';
import { Messages } from '../components/layout/messages.js';

// Invitado
import { InvitadoHome } from '../components/invitado/home.js';
import { InvitadoVerLibro } from '../components/invitado/ver-libro.js';
import { Login } from '../components/invitado/login.js';
import { Registro } from '../components/invitado/registro.js';

// Registrar rutas de invitado
router.register('/', InvitadoHome);
router.register('/libros/:id', InvitadoVerLibro);
router.register('/login', Login);
router.register('/registro', Registro);

// Inicializar layout
const navbar = new Navbar();
const messages = new Messages();

navbar.render();
messages.render();

// Escuchar cambios de navegación para actualizar navbar
window.addEventListener('popstate', () => navbar.render());
window.addEventListener('pushstate', () => navbar.render());

// Iniciar router
router.start();