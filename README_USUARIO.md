# 📚 Librería Online - Guía de Usuario

## 🚀 Inicio Rápido

### Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Iniciar servidor:**
```bash
npm start
```

3. **Abrir navegador:**
```
http://localhost:3000
```

## 👥 Usuarios de Prueba

### Administrador
- **Email:** admin@libreria.com
- **Password:** admin123
- **Acceso:** Rutas `/a/*`

### Clientes
- **Email:** juan@mail.com | **Password:** 123456
- **Email:** maria@mail.com | **Password:** 123456
- **Acceso:** Rutas `/c/*`

## 🧪 Login Rápido (Consola del Navegador)

### Entrar como Administrador
```javascript
localStorage.setItem('usuario', JSON.stringify({
    id: 1,
    nombre: 'Admin Principal',
    email: 'admin@libreria.com',
    password: 'admin123',
    rol: 'admin'
}));
location.reload();
```

Luego navega a: `http://localhost:3000/a`

### Entrar como Cliente
```javascript
localStorage.setItem('usuario', JSON.stringify({
    id: 2,
    nombre: 'Juan Pérez',
    email: 'juan@mail.com',
    password: '123456',
    rol: 'cliente',
    direccion: 'Calle Mayor 1'
}));
location.reload();
```

Luego navega a: `http://localhost:3000/c`

### Cerrar Sesión
```javascript
localStorage.clear();
location.reload();
```

## 📋 Funcionalidades por Rol

### 🌐 Invitado (Sin Login)
- Ver home con libros destacados
- Ver catálogo de libros
- Ver detalles de libros
- Registrarse
- Iniciar sesión

### 👤 Cliente
- **Home:** `/c` - Dashboard con accesos rápidos
- **Catálogo:** `/c/libros` - Todos los libros con búsqueda
- **Detalle:** `/c/libros/:id` - Ver libro y añadir al carro
- **Carro:** `/c/carro` - Gestionar compras
- **Compras:** `/c/compras` - Historial de pedidos
- **Perfil:** `/c/perfil` - Datos personales y estadísticas

### 🔧 Administrador
- **Dashboard:** `/a` - Estadísticas generales
- **Gestión:** `/a/libros` - Lista completa con acciones
- **Crear:** `/a/libros/nuevo` - Añadir nuevo libro
- **Editar:** `/a/libros/editar/:id` - Modificar libro
- **Perfil:** `/a/perfil` - Datos de admin

## 🛒 Flujo de Compra (Cliente)

1. Navegar a `/c/libros`
2. Buscar libro deseado
3. Click en "Ver detalles"
4. Seleccionar cantidad
5. Click en "🛒 Añadir al Carro"
6. Ir a `/c/carro`
7. Revisar productos
8. Click en "Finalizar Compra"
9. Ver confirmación y pedido en `/c/compras`

## 📖 Gestión de Libros (Admin)

### Crear Libro
1. Ir a `/a/libros/nuevo`
2. Rellenar formulario:
   - Título *
   - Autor *
   - ISBN *
   - Precio *
   - Stock *
   - Portada (URL) *
   - Editorial
   - Año
   - Páginas
   - Idioma
   - Descripción
3. Click en "Crear Libro"

### Editar Libro
1. Ir a `/a/libros`
2. Click en "Editar" en el libro deseado
3. Modificar campos
4. Click en "Guardar Cambios"

### Eliminar Libro
1. Ir a `/a/libros`
2. Click en "Eliminar" en el libro deseado
3. Confirmar eliminación

## 🔐 Seguridad y Rutas

### Protección por Rol
- Las rutas `/a/*` requieren rol `admin`
- Las rutas `/c/*` requieren rol `cliente`
- Si intentas acceder sin permiso, serás redirigido

### Persistencia
- La sesión se guarda en `localStorage`
- El carro de compras persiste entre sesiones
- El historial de compras se mantiene

## 🎨 Características

✅ **SPA:** Navegación sin recargas  
✅ **Responsive:** Adaptado a móviles  
✅ **Feedback:** Mensajes de éxito/error  
✅ **Validación:** Formularios validados  
✅ **Guards:** Rutas protegidas por rol  
✅ **Búsqueda:** Filtrado en tiempo real  
✅ **Stock:** Control automático  

## 🐛 Solución de Problemas

### No puedo hacer login
1. Verifica las credenciales
2. Limpia localStorage: `localStorage.clear()`
3. Recarga la página

### No veo el panel de admin/cliente
1. Asegúrate de estar logueado
2. Verifica tu rol: `JSON.parse(localStorage.getItem('usuario')).rol`
3. Navega manualmente a `/a` o `/c`

### Error en PowerShell (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### El carro está vacío después de recargar
El carro se guarda en localStorage y debería persistir. Verifica:
```javascript
JSON.parse(localStorage.getItem('carro'))
```

## 📧 Soporte

Para problemas técnicos, consulta el README.md técnico del proyecto.

---

💡 **Tip:** Usa la consola del navegador (F12) para debugging rápido.
