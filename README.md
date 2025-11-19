# Libreria Online – Practica 2 (Servicios Web)

Aplicacion SPA basada en Express que evoluciona la practica 1 hacia una arquitectura API REST con un proxy en el cliente. Este documento resume la arquitectura actual, como ejecutar el proyecto y el grado de cumplimiento frente a los requisitos marcados para la Practica 2 de Tecnologias y Sistemas Web (curso 24/25).

## Ejecucion

1. Instalar dependencias: `npm install`
2. Arrancar servidor + SPA: `npm start` (sirve `public/` en `http://localhost:3000` y expone la API bajo `/api`)
3. Pruebas actuales: no existe suite CLI; el script `npm test` solo arranca el servidor y sugiere abrir `http://localhost:3000/test.html`.

## Arquitectura actual

- **Backend (app.mjs, servidor Express)**: expone recursos `libros`, `clientes`, `admins`, `facturas` y alias `compras`, apoyandose en un repositorio en memoria (`server/model/library-repository.mjs`) que migra el modelo de la practica 1 al servidor pero sin persistencia externa.
- **Dominio**: `server/domain/libro.mjs` y `server/domain/usuario.mjs`, mas la clase interna `Factura`.
- **Cliente SPA**: `public/libreria/js` con router propio, componentes para invitado/cliente/admin y una capa de estado (`libreria-store.mjs`) que consume el proxy HTTP.
- **Proxy REST (`libreria-proxy.mjs`)**: encapsula fetch y se usa desde store/autenticacion para hablar con `/api`.
- **Modelo heredado (`model/seeder.mjs`)**: sigue presente y varios componentes lo usan directamente, lo que genera inconsistencias respecto al proxy.

## Estado frente al procedimiento de la practica

| Paso | Descripcion | Estado | Notas |
| --- | --- | --- | --- |
| 1 | Copiar practica 1 | Completado | Proyecto incluye el legado completo de la practica 1 (componentes, modelo local, pruebas en navegador). |
| 2 | Migrar modelo al servidor | Parcial | Existe `library-repository.mjs` con logica compartida, pero mantiene datos en memoria (sin persistencia duradera). |
| 3 | Generar API REST Tabla 1 | Parcial | CRUD basico expuesto, pero falta cubrir rutas masivas, filtros por email/dni, signin y operaciones de facturas indicadas en la tabla (detalle abajo). |
| 4 | Pruebas CLI con mocha/chai/chai-http | No iniciado | Solo hay pruebas del modelo antiguo en `test/model.spec.js`, ejecutables en navegador; `chai-http` no esta instalado. |
| 5 | Proxy cliente contra API REST | Parcial | `libreria-proxy.mjs` existe y cubre los endpoints basicos, pero omite metodos como `setLibros`, `removeLibros`, `setClientes`, etc. |
| 6 | Adaptar pruebas del navegador al proxy | No iniciado | La suite sigue apuntando al modelo local (`model/seeder.mjs`). |
| 7 | Adaptar front-end al proxy | Parcial | Algunos presenters usan `libreria-store`, pero muchos componentes (carro, compras, perfiles, vistas admin) siguen leyendo del seeder local. |

## Cobertura de la API vs Tabla 1

### Libros
- Implementado: `GET /libros`, `GET /libros/:id`, `POST /libros`, `PUT /libros/:id`, `DELETE /libros/:id`, mas filtros `isbn` y `titulo` via query (`app.mjs:29-95`).
- Pendiente: `PUT /libros` (set array sin IDs), `DELETE /libros` (remove todos).

### Clientes
- Implementado: CRUD por id y autenticacion (`/clientes`, `/clientes/:id`, `/clientes/autenticar`, `/clientes/:id/carro/...`) (`app.mjs:103-205`).
- Pendiente: `PUT /clientes` (bulk set), `DELETE /clientes` (borrado masivo), filtros `?email=` y `?dni=`, ruta `POST /clientes/signin`.

### Admins
- Implementado: CRUD por id y autenticacion (`/admins`, `/admins/:id`, `/admins/autenticar`) (`app.mjs:217-270`).
- Pendiente: `PUT /admins`, `DELETE /admins`, filtros `?email=` / `?dni=`, y `POST /admins/signin`.

### Facturas
- Implementado: `GET /facturas`, `GET /facturas/:id`, filtros `?numero=` y `?cliente=`, `POST /facturas` y alias `/compras` (`app.mjs:278-349`).
- Pendiente: `PUT /facturas`, `DELETE /facturas`, `setFacturas(array)` completo, asi como operaciones para eliminar todas las facturas.

## Proxy y front-end

- `public/libreria/js/model/libreria-proxy.mjs` expone las rutas basicas pero no ofrece los metodos `set*`/`remove*` pedidos en la tabla, por lo que aun cuando el backend los implementara el cliente no podria llamarlos.
- `libreria-store.mjs` usa el proxy y mantiene cache para libros, clientes, admins y facturas.
- Componentes que ya consumen el store (ej. `components/invitado/home.mjs`, `components/cliente/home.mjs`) se benefician del proxy.
- Componentes criticos siguen atados al modelo local (`model/seeder.mjs`), entre ellos:
  - Cliente: carro, compras, pago, ver-libro, modificar-perfil (`public/libreria/js/components/cliente/*.mjs` lineas 1-5 en varios archivos).
  - Admin: home, ver-libro, libro-form, perfil y modificar-perfil (`public/libreria/js/components/admin/*.mjs` lineas iniciales).
  - Invitado: ver-libro (`public/libreria/js/components/invitado/ver-libro.mjs:2`).
  Esta mezcla impide validar el proxy y rompe el requisito 7.

## Pruebas

- Solo existe `test/model.spec.js`, dependiente del objeto global `window`/`localStorage` y del modelo local (`test/model.spec.js:1-38`).
- El script `npm test` no ejecuta mocha ni chai, simplemente muestra un mensaje para abrir un HTML (`package.json:7-11`).
- Falta `chai-http` en las dependencias de desarrollo para poder disparar pruebas REST desde linea de comandos (`package.json:22-24`).

## RNF y persistencia

- El repositorio en memoria se resetea cada vez que se levanta el servidor (`server/model/library-repository.mjs:51-75`), por lo que no hay persistencia real (RNF-2 pendiente).
- No se han identificado mensajes de feedback unificados en la API (RNF-1) mas alla de textos libres.

## Fallos y brechas detectadas

- **Componentes cliente siguen usando el modelo local** en vez del store/proxy, por ejemplo `ClienteCarro` (`public/libreria/js/components/cliente/carro.mjs:1-116`) busca libros en `model.libros` e ignora las rutas `/api/clientes/:id/carro`, por lo que no se prueba el backend ni se sincroniza el carro real.
- **Suites de prueba no migradas**: `test/model.spec.js:3-16` importa el seeder y accede a `window`/`localStorage`, incumpliendo los requisitos 4 y 6.
- **API incompleta respecto a Tabla 1**: solo existen rutas unitarias (`app.mjs:29-349`). No hay `PUT/DELETE` sobre colecciones ni filtros `/clientes?email=` o `/admins?dni=`, lo que limita la cobertura funcional exigida.
- **Proxy limitado**: `libreria-proxy.mjs:96-198` solo ofrece CRUD basico; no hay metodos para `setLibros`, `removeLibros`, `setClientes`, `removeClientes`, `setAdmins`, `removeAdmins`, `setFacturas` o `removeFacturas`, impidiendo ejercer toda la API una vez se implemente.
- **Persistencia ausente**: el servidor invoca `reset()` en memoria al arrancar (`server/model/library-repository.mjs:51-69`), por lo que los datos vuelven a los seeds despues de cada reinicio, incumpliendo el RNF de persistencia.
- **Autenticacion parcial**: solo existe `/clientes/autenticar` y `/admins/autenticar`; la ruta alternativa `/signin` pedida en la tabla no esta disponible (`app.mjs:158-268`).
- **Pruebas REST inexistentes**: tampoco hay comandos o ficheros de mocha + chai-http que llamen a `/api`, dificultando la evaluacion de las tres rubricas de pruebas descritas.

## Siguientes pasos sugeridos

1. Completar las rutas REST faltantes (bulk set/remove, filtros por query y signin).
2. Ampliar `libreria-proxy` y `libreria-store` para cubrir todas las operaciones nuevas y exponerlas al front-end.
3. Refactorizar los presenters restantes para que solo usen el store/proxy y eliminen la dependencia de `model/seeder.mjs`.
4. Implementar suites de prueba CLI con mocha/chai/chai-http que cubran la API, el proxy y los calculos solicitados, y actualizar `npm test` para ejecutarlas realmente.
5. Añadir un mecanismo de persistencia (archivo JSON, base de datos o mock) para cumplir el RNF de almacenamiento duradero.

