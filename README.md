# 1) Stack y principios

- **Stack**: Node.js + **Express** (servidor estático + fallback `/*` a `index.html`), **JS (ESM)** sin framework (para seguir el modelo de Presenter/Router del enunciado), **Mocha + Chai** para tests in-browser.
- **SPA con History API**: enrutado cliente, guardas por **rol** (invitado / cliente / admin) y **persistencia de sesión** (usuario+rol) en `sessionStorage` tal como pide RNF.
- **Mock de dominio en cliente**: clases JS (Libro, Usuario, Carro, Pedido, etc.) como backend simulado.
- **Mensajes de feedback** centralizados (éxito/info/errores) y **páginas de error**.

# 2) Estructura de carpetas

```
/public
  index.html
  styles.css
  /libreria
    /js
      /commons
        router.js          // Enrutado cliente + guards
        presenter.js       // Clase base de componentes (render + eventos)
        libreria-session.js// sesión (usuario/rol) + bus de mensajes
      /components
        layout/
          navbar.js
          messages.js
        invitado/
          home.js          // invitado-home
          ver-libro.js     // invitado-ver-libro
          login.js         // invitado-ingreso
          registro.js      // invitado-registro
        cliente/
          home.js          // cliente-home
          ver-libro.js     // cliente-ver-libro
          carro.js         // cliente-carro
          checkout.js      // cliente-comprar-carro + pagar
          compras.js       // cliente-lista-compras
          compra-detalle.js// cliente-ver-compra
          perfil.js        // cliente-perfil
        admin/
          home.js          // admin-home
          ver-libro.js     // admin-ver-libro
          libro-nuevo.js   // admin-agregar-libro
          libro-editar.js  // admin-modificar-libro
          perfil.js        // admin-perfil
      /model
        index.js           // seed + agregados
        libro.js, usuario.js, carro.js, pedido.js, pago.js ...
      main.mjs             // punto de entrada, bootstrapping
/test
  model.spec.js
  flows.spec.js
server.js              // Express para servir la SPA
```

Esta organización sigue el diagrama de **componentes** y los módulos indicados.

# 3) Rutas y guardas por rol

Mapeo directo a los **RF** (nombres entre paréntesis del enunciado):

- Invitado: `/`, `/libros`, `/libros/:id`, `/login`, `/registro`.
- Cliente: `/c`, `/c/libros`, `/c/libros/:id`, `/c/carro`, `/c/checkout`, `/c/pagar`, `/c/compras`, `/c/compras/:id`, `/c/perfil`.
- Admin: `/a`, `/a/libros`, `/a/libros/:id`, `/a/libros/nuevo`, `/a/libros/:id/editar`, `/a/perfil`.
- **Guards**: si no hay sesión → invitado; si rol ≠ requerido → redirigir a _home_ de su perfil (el enunciado pide “en todo momento” enlace a home de cada perfil).

# 4) Componentes clave (UI)

- **Layout**: `Navbar` (switch de perfil, enlace constante al _home_ de cada perfil), `Messages` (pila de notificaciones/errores).
- **Catálogo/Listado** (invitado/cliente/admin): grid de tarjetas, búsqueda mínima (client-side), paginación simple.
- **Detalle de libro**: portada, metadatos, acciones contextuales: _Agregar al carro_ (cliente), _Editar/Eliminar_ (admin).
- **Carro**: línea editable (cantidad), totales, CTA a checkout.
- **Checkout & Pago**: pasos “Resumen → Dirección → Pago → Confirmación” (se puede simplificar a una sola pantalla si prefieres), feedback en cada etapa.
- **Compras**: lista y detalle (cliente).
- **Administración libros**: crear, editar (campos con validación), **eliminar** con confirmación.
- **Perfiles**: formularios de perfil para admin/cliente.
- **Errores**: 404/403/500 según corresponda.

# 5) Dominio (mock en cliente)

Basado en el **diagrama de clases** del PDF; clases mínimas: `Libro`, `Usuario{rol}`, `Carro{items}`, `Pedido{lineas, total}`, `Pago`, `Compra`. Persistencia en memoria + `sessionStorage` para usuario/rol.

> **Cálculo básico**
> ( \displaystyle \text{totalCarro}=\sum_i \text{precio}\_i \cdot \text{cantidad}\_i )
> Validaciones: stock ≥ 0, cantidad ≥ 1; excepciones con mensajes al `Messages`.

# 6) Common: Router / Presenter / LibreriaSession

**Router**: tabla de rutas → clase de componente; `navigate(path, state)`; intercepta `<a>`; `history.pushState`.
**Presenter**: `constructor(model, name, mountSelector='main')`; `render(props)`, `bind()`, `unmount()`.
**LibreriaSession**: `{getUser(), setUser(u), clearUser(), getRole()}` + **bus de mensajes** `{pushInfo, pushError, consume()}`. Todo conforme al doc.

# 7) Flujo de RNF

- **Mensajes de feedback** en acciones: login/registro, CRUD de libros, carro/checkout/pago.
- **Persistencia de sesión**: usuario+rol (RNF 4).
- **Páginas de error**: cobertura de rutas prohibidas/no encontradas.

# 8) Tests (Mocha + Chai, en navegador)

Cubriendo la rúbrica de **Pruebas**: getters/setters, excepciones, agregar/modificar/eliminar, y cálculos.

- `model.spec.js`:

  - Crea `Libro`, `Carro`, `Pedido` ⇒ getters/setters.
  - Añadir/editar/eliminar libro y líneas de carro ⇒ estados esperados.
  - Excepciones (stock negativo, precio inválido, rutas sin permiso).
  - Cálculos: totales, redondeo.

- `flows.spec.js`:

  - Navegación invitado→detalle→login→cliente→carro→checkout→confirmación.
  - Admin: crear/editar/eliminar libro y ver reflejo en catálogo.

# 9) Express mínimo (RNF: NodeJS+Express)

```js
// server.js
import express from "express";
const app = express();
app.use(express.static("public"));
app.get("*", (_, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(3000);
```

Sirve SPA y cumple RNF sin meter lógica de backend real.

# 10) Entregables y criterio de corrección

- **Funcional (60 pts)**: todas las vistas por rol, carro/checkout/pago, CRUD admin, perfiles (mapa RF del PDF).
- **No funcional (15 pts)**: feedback, persistencia de sesión.
- **Pruebas (25 pts)**: batería descrita arriba. **Evitar errores de navegación/recarga** (historial y guards bien hechos).

# 11) Roadmap sugerido (rápido)

1. **Model + seed** → 2) **Router + Layout** → 3) **Catálogo y detalle (invitado)** → 4) **Login/registro + sesión** →
2. **Flujo cliente (carro→checkout→pago→compras)** → 6) **Admin CRUD + perfil** → 7) **Perfiles cliente/admin** →
3. **Mensajes y errores** → 9) **Tests** → 10) **Pulido UI/UX**.
