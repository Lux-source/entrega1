# Librería Online - Práctica Web (Entrega 1)

Este proyecto es una Single Page Application (SPA) para una librería online, desarrollada con una arquitectura cliente-servidor utilizando Node.js, Express y Vanilla JS.

## Ejecución

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar la aplicación:**
    ```bash
    npm start
    ```
    Esto iniciará el servidor en `http://localhost:3000`.
3.  **Pruebas:**
    El proyecto cuenta con dos suites de pruebas para cumplir con la rúbrica:

    - **Pruebas REST (Backend - CLI):**
      Ejecutan pruebas directas contra la API usando `mocha` y `chai-http`.

      ```bash
      npm run test-rest
      ```

    - **Pruebas Proxy (Frontend - Navegador):**
      Prueban la integración del cliente con el servidor a través del Proxy.
      ```bash
      npm test
      ```
      Luego abre `http://localhost:3000/test.html` en tu navegador.

## Arquitectura

El proyecto sigue una arquitectura separada en capas:

### Backend (`server/`)

- **API REST**: Expone endpoints en `/api/libros`, `/api/clientes`, `/api/admins`, etc.
- **Controladores**: (`server/controllers/`) Manejan la lógica de las peticiones HTTP.
- **Servicios**: (`server/services/`) Contienen la lógica de negocio y validaciones.
- **Persistencia**: (`server/data/db-context.mjs`) Gestiona la persistencia de datos en un archivo JSON (`server/data/database.json`). Se ha implementado un mecanismo de auto-reparación para inicializar la estructura de la base de datos si está corrupta o vacía.

### Frontend (`public/libreria/js/`)

- **SPA**: Navegación sin recargas utilizando un Router personalizado (`router.mjs`).
- **Componentes**: Organizados por roles (`invitado`, `cliente`, `admin`).
- **Store & Proxy**:
  - `libreria-proxy.mjs`: Encapsula las llamadas `fetch` a la API del backend.
  - `libreria-store.mjs`: Gestiona el estado global de la aplicación (libros, usuarios, sesión) y sincroniza con el backend a través del proxy.
  - `auth-service.mjs`: Gestiona la autenticación y registro.
  - `cart-service.mjs`: Gestiona la lógica del carrito de compras.

## Cambios Importantes

### 1. Traducción y Refactorización al Español

Todo el backend y el frontend han sido refactorizados para utilizar terminología en español, alineando el código con el dominio del problema:

- `Book` -> `Libro`
- `User` -> `Usuario` (con roles `ADMIN` y `CLIENTE`)
- Endpoints: `/api/books` -> `/api/libros`, `/api/users` -> `/api/clientes` / `/api/admins`.

### 2. Persistencia Robusta

Se ha mejorado `DbContexto` para asegurar que el archivo `database.json` siempre tenga una estructura válida. Si el archivo no existe o está corrupto, se regenera automáticamente con las colecciones necesarias (`libros`, `clientes`, `admins`, `facturas`, `_contadores`).

### 3. Corrección de Flujos

- **Registro**: Se corrigió un error donde los nuevos administradores eran redirigidos incorrectamente a la vista de cliente, causando errores 403. Ahora el sistema detecta el rol y redirige a `/a` (admin) o `/c` (cliente).
- **Formularios**: Se añadieron atributos `autocomplete` en los formularios de perfil para mejorar la experiencia de usuario y evitar advertencias del navegador.

## Flujos Principales

### Autenticación (Login)

1.  El usuario introduce email y contraseña.
2.  `auth-service.iniciarSesion()` llama a `libreriaProxy.autenticarCliente()` o `autenticarAdmin()`.
3.  El servidor (`clienteController.autenticar`) verifica las credenciales usando `usuarioService`.
4.  Si es correcto, devuelve el usuario y un token simulado.
5.  El cliente guarda el token y redirige al home correspondiente (`/c` o `/a`).

### Registro

1.  El usuario completa el formulario de registro.
2.  `auth-service.registrar()` valida los datos en el cliente (longitud, formatos).
3.  Si es válido, llama a `libreriaStore.crearCliente()` (o admin).
4.  El servidor (`clienteController.crearCliente`) verifica unicidad de email/DNI y guarda el usuario en `database.json`.
5.  Al finalizar, el usuario es logueado automáticamente y redirigido.

### Carrito de Compras

1.  El cliente añade un libro (`cart-service.agregarItem()`).
2.  Se envía una petición `POST` a `/api/clientes/:id/carro/items`.
3.  El servidor verifica el stock y actualiza el carrito del usuario en la base de datos.
4.  La vista del carrito (`cliente/carro.mjs`) se actualiza reflejando el subtotal y total calculados.

### Gestión de Admin

1.  El administrador accede a su panel.
2.  Puede ver la lista de libros (`libreriaStore.getLibros()`).
3.  Puede crear, editar o eliminar libros. Estas acciones viajan a través del proxy a `/api/libros`.
