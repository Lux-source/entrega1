# 1) Stack y principios

- **Stack**: Node.js + **Express** (servidor estático + fallback `/*` a `index.html`), **JS (ESM)** sin framework (para seguir el modelo de Presenter/Router del enunciado), **Mocha + Chai** para tests in-browser.
- **SPA con History API**: enrutado cliente, guardas por **rol** (invitado / cliente / admin) y **persistencia de sesión** (usuario+rol) en `localStorage` tal como pide RNF.
- **Mock de dominio en cliente**: clases JS (Libro, Usuario, Carro, Pedido, etc.) como backend simulado.
- **Mensajes de feedback** centralizados (éxito/info/errores) y **páginas de error**.
- **Arquitectura de Presenters**: Cada componente tiene un archivo `.mjs` (presenter) que carga un template HTML correspondiente, maneja el DOM y eventos. Los templates se cargan dinámicamente usando `fetch` y `import.meta.url` para mantener separación de lógica y vista.

# 2) Estructura de carpetas

```
/public
  index.html
  styles.css
  /libreria
    /js
      /commons
        router.mjs          // Enrutado cliente + guards
        presenter.mjs       // Clase base de componentes (render + eventos)
        libreria-session.mjs// sesión (usuario/rol) + bus de mensajes
      /components
        layout/
          navbar.html       // Template HTML para navbar
          navbar.mjs        // Presenter para navbar
          messages.html     // Template HTML para mensajes
          messages.mjs      // Presenter para mensajes
        error/
          403.html          // Template HTML para error 403
          403.mjs           // Presenter para error 403
          404.html          // Template HTML para error 404
          404.mjs           // Presenter para error 404
        invitado/
          home.html         // Template HTML para home invitado
          home.mjs          // Presenter para home invitado
          ver-libro.html    // Template HTML para ver libro invitado
          ver-libro.mjs     // Presenter para ver libro invitado
          login.html        // Template HTML para login
          login.mjs         // Presenter para login
          registro.html     // Template HTML para registro
          registro.mjs      // Presenter para registro
        cliente/
          home.html         // Template HTML para home cliente
          home.mjs          // Presenter para home cliente
          ver-libro.html    // Template HTML para ver libro cliente
          ver-libro.mjs     // Presenter para ver libro cliente
          carro.html        // Template HTML para carro
          carro.mjs         // Presenter para carro
          pago.html         // Template HTML para pago
          pago.mjs          // Presenter para pago
          compras.html      // Template HTML para compras
          compras.mjs       // Presenter para compras
          perfil.html       // Template HTML para perfil cliente
          perfil.mjs        // Presenter para perfil cliente
          modificar-perfil.html // Template HTML para modificar perfil
          modificar-perfil.mjs // Presenter para modificar perfil
        admin/
          home.html         // Template HTML para home admin
          home.mjs          // Presenter para home admin
          ver-libro.html    // Template HTML para ver libro admin
          ver-libro.mjs     // Presenter para ver libro admin
          libro-form.html   // Template HTML para formulario de libro
          libro-form.mjs    // Presenter para formulario de libro
          perfil.html       // Template HTML para perfil admin
          perfil.mjs        // Presenter para perfil admin
          modificar-perfil.html // Template HTML para modificar perfil admin
          modificar-perfil.mjs // Presenter para modificar perfil admin
      /model
        index.js           // seed + agregados
        libro.js, usuario.js, carro.js, pedido.js, pago.js ...
        auth-store.js      // Gestión reactiva de autenticación
        auth-service.js    // Servicios de autenticación
      main.mjs             // punto de entrada, bootstrapping
/test
  model.spec.js
  flows.spec.js
server.js              // Express para servir la SPA
```

Esta organización sigue el diagrama de **componentes** y los módulos indicados, con separación clara entre templates HTML y lógica JS en módulos ESM (.mjs).

# 3) Cómo funciona el sistema de Presenters

Cada componente de la aplicación sigue el patrón Presenter:

- **Template HTML**: Archivo `.html` que define la estructura de la vista con atributos `data-element` para identificar elementos DOM.
- **Presenter (.mjs)**: Clase que extiende `Presenter`, carga el template usando `fetch(new URL('./template.html', import.meta.url))`, renderiza el HTML en el contenedor, y maneja eventos y lógica.
- **Flujo típico**:
  1. El router instancia el presenter correspondiente.
  2. `render()` inserta el HTML en el DOM.
  3. `bind()` cachea elementos DOM y añade event listeners.
  4. `unmount()` limpia listeners y recursos.

Esto permite separación de responsabilidades: HTML para markup, JS para lógica, facilitando mantenimiento y reutilización.

# 4) Rutas y guardas por rol

Mapeo directo a los **RF** (nombres entre paréntesis del enunciado):

- Invitado: `/`, `/libros/:id`, `/login`, `/registro`.
- Cliente: `/c`, `/c/libros/:id`, `/c/carro`, `/c/pago`, `/c/compras`, `/c/perfil`, `/c/modificar-perfil`.
- Admin: `/a`, `/a/libros/:id`, `/a/libros/nuevo`, `/a/libros/:id/editar`, `/a/perfil`, `/a/modificar-perfil`.
- **Guards**: si no hay sesión → invitado; si rol ≠ requerido → redirigir a _home_ de su perfil (el enunciado pide “en todo momento” enlace a home de cada perfil).

# 5) Componentes clave (UI)

- **Layout**: `Navbar` (switch de perfil, enlace constante al _home_ de cada perfil), `Messages` (pila de notificaciones/errores).
- **Catálogo/Listado** (invitado/cliente/admin): grid de tarjetas, búsqueda mínima (client-side), paginación simple.
- **Detalle de libro**: portada, metadatos, acciones contextuales: _Agregar al carro_ (cliente), _Editar/Eliminar_ (admin).
- **Carro**: línea editable (cantidad), totales, CTA a checkout.
- **Pago**: resumen del carro, formulario de envío, confirmación de compra.
- **Compras**: lista y detalle (cliente).
- **Administración libros**: crear, editar (campos con validación), **eliminar** con confirmación.
- **Perfiles**: formularios de perfil para admin/cliente.
- **Errores**: 404/403/500 según corresponda.

# 6) Dominio (mock en cliente)

Basado en el **diagrama de clases** del PDF; clases mínimas: `Libro`, `Usuario{rol}`, `Carro{items}`, `Pedido{lineas, total}`, `Pago`, `Compra`. Persistencia en memoria + `localStorage` para usuario/rol y carro/compras.

> **Cálculo básico**
> ( \displaystyle \text{totalCarro}=\sum_i \text{precio}\_i \cdot \text{cantidad}\_i )
> Validaciones: stock ≥ 0, cantidad ≥ 1; excepciones con mensajes al `Messages`.

# 7) Common: Router / Presenter / LibreriaSession / AuthStore

**Router**: tabla de rutas → clase de componente; `navigate(path, state)`; intercepta `<a>`; `history.pushState`.
**Presenter**: `constructor(model, name, mountSelector='main')`; `render(props)`, `bind()`, `unmount()`.
**LibreriaSession**: `{getUser(), setUser(u), clearUser(), getRole()}` + **bus de mensajes** `{pushInfo, pushError, consume()}`. Todo conforme al doc.
**AuthStore**: Gestión reactiva de autenticación con observers para cambios de estado.

# 8) Flujo de RNF

- **Mensajes de feedback** en acciones: login/registro, CRUD de libros, carro/pago.
- **Persistencia de sesión**: usuario+rol (RNF 4).
- **Páginas de error**: cobertura de rutas prohibidas/no encontradas.

# 9) Tests (Mocha + Chai, en navegador)

Cubriendo la rúbrica de **Pruebas**: getters/setters, excepciones, agregar/modificar/eliminar, y cálculos.

- `model.spec.js`:

  - Crea `Libro`, `Carro`, `Pedido` ⇒ getters/setters.
  - Añadir/editar/eliminar libro y líneas de carro ⇒ estados esperados.
  - Excepciones (stock negativo, precio inválido, rutas sin permiso).
  - Cálculos: totales, redondeo.

- `flows.spec.js`:

  - Navegación invitado→detalle→login→cliente→carro→pago→confirmación.
  - Admin: crear/editar/eliminar libro y ver reflejo en catálogo.

# 10) Express mínimo (RNF: NodeJS+Express)

```js
// server.js
import express from "express";
const app = express();
app.use(express.static("public"));
app.get("*", (_, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(3000);
```

Sirve SPA y cumple RNF sin meter lógica de backend real.

# 11) Entregables y criterio de corrección

- **Funcional (60 pts)**: todas las vistas por rol, carro/pago, CRUD admin, perfiles (mapa RF del PDF).
- **No funcional (15 pts)**: feedback, persistencia de sesión.
- **Pruebas (25 pts)**: batería descrita arriba. **Evitar errores de navegación/recarga** (historial y guards bien hechos).

# 12) Roadmap sugerido (rápido)

1. **Model + seed** → 2) **Router + Layout** → 3) **Catálogo y detalle (invitado)** → 4) **Login/registro + sesión** → 5) **Flujo cliente (carro→pago→compras)** → 6) **Admin CRUD + perfil** → 7) **Perfiles cliente/admin** → 8) **Mensajes y errores** → 9) **Tests** → 10) **Pulido UI/UX**.
