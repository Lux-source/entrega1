# Entrega1 - Guia rapida

## Que es esto

SPA de libreria con backend Express/Mongo, proxy de datos en el front y vistas modulares en `public/`. Incluye pruebas unitarias y de integracion para los modelos, la API REST y el proxy/frontend.

## Estructura de carpetas

- `app.mjs`: arranque de servidor Express y registro de rutas.
- `server/`
  - `config/`: base de datos (`database.mjs`) y `passport`.
  - `data/`: `db-context.mjs` (semillas/reinicio).
  - `domain/`: entidades de dominio simples.
  - `models/`: modelos Mongoose (Libro, Usuario, Factura, Carro).
  - `controllers/`: logica de rutas (libros, cliente, admin, factura).
  - `services/`: reglas de negocio (libro, usuario, factura).
  - `routes/`: definicion de endpoints REST por recurso.
- `public/`
  - `index.html` + `styles.css`.
  - `libreria/js/commons/`: utilidades de sesion (`libreria-session.mjs`), router y presenter.
  - `libreria/js/model/`: store/proxy/auth/cart y modelos JS del front.
  - `libreria/js/components/`: vistas por rol (invitado, cliente, admin), layout, mensajes.
- `test/`: suites de prueba (`model.spec.js`, `rest.spec.js`, `proxy.spec.js`).

## Capas y flujo

- **Frontend (SPA)**: HTML/JS en `public/` usa componentes y modelos JS para pintar UI. Gestiona sesion en `commons/libreria-session.mjs` y estado en `auth-store.mjs`/`libreria-store.mjs`.
- **Proxy del front**: `libreria-proxy.mjs` encapsula llamadas fetch a `/api` con helpers de headers y querystring; lo usan servicios del front (auth, carrito, etc.).
- **API REST**: Express en `app.mjs` y `server/routes/*` expone `/api/libros`, `/api/clientes`, `/api/admins`, `/api/facturas`, `/api/compras`. Controladores delegan en servicios, que operan sobre modelos Mongoose.
- **Backend/BD**: Modelos en `server/models` (Mongo/Mongoose) manejan validaciones y metodos de dominio; `db-context.mjs` aporta datos seed y reseteo para tests.

## Pruebas (que valida cada una)

- `test/model.spec.js` (backend + BD): unitarios de modelos Mongoose. Verifica getters/setters, validaciones, CRUD y calculos (totales de facturas, reduccion de stock) con todos los atributos persistidos. Corre contra la base de datos de test.
- `test/rest.spec.js` (API REST): integracion HTTP sobre Express. Comprueba respuestas completas de los endpoints (atributos de libros/usuarios/facturas/compras), errores 4xx, CRUD y calculos. Tambien valida efectos en BD (stock, numeracion de facturas).
- `test/proxy.spec.js` (frontend/proxy): ejecuta en el navegador sobre los bundles del front. Valida modelos JS, auth store/session, reglas de validacion, generacion/verificacion de tokens y operaciones del `libreriaProxy` incluyendo facturacion y actualizacion de stock.

## Como ejecutar pruebas

- Backend y REST: `npm test` (ejecuta `model.spec.js` y `rest.spec.js`), o por separado `npm run test-model` / `npm run test-rest`. Requiere Mongo accesible segun `server/config/database.mjs`.
- Proxy/frontend: abrir `public/test.html` (o `public/test.html` segun tu runner) en un navegador con el servidor en marcha (`npm start`). Usa el entorno de test del front y la API en `/api`.

## Notas para desarrolladores

- Si añades atributos a modelos o DTOs, actualiza las tres capas: modelo Mongoose, servicio/controlador REST y los modelos/servicios del front, mas las pruebas correspondientes.
- `db.reiniciar()` se usa en tests para dejar la base en estado conocido; no lo uses en produccion.
- Mantener consistencia de IDs (strings de 24 chars) entre front y back; las pruebas lo esperan.
