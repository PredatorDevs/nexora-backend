# Objetivo del backend boilerplate

El backend debe quedar preparado para iniciar aplicaciones nuevas sin repetir infraestructura transversal. Debe incluir:

* API REST con Express.
* MySQL administrado mediante Prisma.
* Autenticación basada en sesiones y tokens.
* RBAC basado en permisos.
* Validación centralizada.
* Manejo uniforme de errores.
* Logging estructurado y trazabilidad.
* Auditoría.
* Pruebas unitarias, de integración y end-to-end.
* Migraciones y datos iniciales.
* Seguridad HTTP.
* Docker y configuración por ambientes.
* Capacidad de servir el build del frontend en producción desde una ruta configurable.

La lógica particular de cada aplicación deberá agregarse como nuevos módulos, sin modificar el núcleo del boilerplate.

---

# 1. Decisiones técnicas iniciales

## Base tecnológica

```text
Node.js LTS
Express
JavaScript con módulos ESM
MySQL 8+
Prisma ORM
Zod
Vitest
Supertest
Pino
```

## Convenciones principales

* API versionada bajo `/api/v1`.
* Código y nombres técnicos en inglés.
* Mensajes de usuario configurables.
* Variables y funciones en `camelCase`.
* Clases y errores en `PascalCase`.
* Tablas MySQL en plural y `snake_case`, o bien `camelCase`, pero aplicando una única convención.
* Fechas almacenadas en UTC.
* IDs internos inicialmente numéricos o UUID, definidos antes de la primera migración.
* Eliminación lógica únicamente donde exista una necesidad funcional real.
* Controladores sin lógica de negocio.
* Servicios independientes del protocolo HTTP.
* Repositorios responsables del acceso a datos.
* Toda entrada externa validada con Zod.

Recomiendo utilizar IDs numéricos autoincrementales para entidades administrativas como usuarios, roles y permisos, y UUID para sesiones, solicitudes y tokens.

---

# 2. Estructura objetivo

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.js
│       ├── permissions.seed.js
│       ├── roles.seed.js
│       └── admin.seed.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── environment.js
│   │   ├── constants.js
│   │   ├── security.js
│   │   └── logger.js
│   │
│   ├── database/
│   │   ├── prisma.js
│   │   └── transaction.js
│   │
│   ├── core/
│   │   ├── errors/
│   │   ├── middleware/
│   │   ├── http/
│   │   ├── security/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── sessions/
│   │   ├── audit/
│   │   └── health/
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   └── static/
│       └── serve-frontend.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── factories/
│   └── helpers/
│
├── scripts/
│   ├── create-admin.js
│   └── verify-environment.js
│
├── docs/
│   ├── architecture.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── database.md
│   └── deployment.md
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── eslint.config.js
├── package.json
└── README.md
```

## Separación crítica

### `app.js`

Construye y configura Express:

```js
export function createApp() {
  const app = express();

  // Middlewares
  // Routes
  // Error handling

  return app;
}
```

No inicia el puerto.

### `server.js`

Inicializa infraestructura:

```js
const app = createApp();

app.listen(environment.port);
```

Esta separación permite probar la aplicación con Supertest sin abrir un puerto real.

---

# 3. Dependencias previstas

## Producción

```bash
npm install \
  express \
  @prisma/client \
  zod \
  argon2 \
  jose \
  cookie-parser \
  helmet \
  cors \
  compression \
  express-rate-limit \
  pino \
  pino-http
```

## Desarrollo

```bash
npm install -D \
  prisma \
  vitest \
  supertest \
  eslint \
  prettier \
  pino-pretty
```

## Dependencias opcionales

Se agregarán solamente si el proyecto las necesita:

```text
multer                 Archivos
nodemailer             Correo electrónico
swagger-ui-express     Interfaz OpenAPI
@scalar/express-api-reference  Documentación moderna de API
ioredis                 Caché y sesiones distribuidas
bullmq                  Trabajos en segundo plano
```

No conviene instalar desde el inicio dependencias que no tengan un caso de uso definido.

---

# 4. Plan de acción por fases

## Fase 0: definición técnica

Antes de generar la primera migración deben quedar cerradas estas decisiones:

* Convención de nombres en MySQL.
* Uso de JavaScript ESM.
* Tipo de IDs.
* Estrategia de fechas y zona horaria.
* Estrategia de autenticación.
* Estrategia de sesiones.
* Formato estándar de respuestas.
* Formato de códigos de permisos.
* Ambientes soportados.
* Política de versionado de API.

### Decisiones recomendadas

```text
API: /api/v1
Permisos: resource.action
Fechas: UTC
Contraseñas: Argon2id
Access token: duración corta
Refresh token: cookie HttpOnly
Sesiones: persistidas en MySQL
Validación: Zod
ORM y migraciones: Prisma
Logging: Pino
```

### Entregable

Documento `docs/architecture.md` con las decisiones y sus razones.

---

## Fase 1: inicialización del proyecto

Se construirá la base ejecutable:

* `package.json`.
* Scripts NPM.
* ESM.
* ESLint.
* Prettier.
* `.gitignore`.
* `.env.example`.
* Configuración de desarrollo.
* `src/app.js`.
* `src/server.js`.
* Endpoint inicial de salud.

### Scripts iniciales

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "prisma db seed"
  }
}
```

### Criterios de aceptación

```text
npm run dev inicia correctamente.
GET /api/v1/health responde HTTP 200.
npm run lint termina sin errores.
Las variables requeridas se validan al iniciar.
```

---

## Fase 2: configuración y ambientes

Se centralizará toda la configuración en `src/config`.

## Variables previstas

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=mysql://user:password@localhost:3306/database

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES_IN=10m
REFRESH_TOKEN_EXPIRES_IN_DAYS=30

REFRESH_COOKIE_NAME=app_refresh_token
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

CORS_ALLOWED_ORIGINS=http://localhost:5173

LOG_LEVEL=debug
TRUST_PROXY=false

SERVE_FRONTEND=false
FRONTEND_DIST_PATH=
```

## Validación

El proceso debe detenerse inmediatamente cuando falte una variable obligatoria:

```js
const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1)
});
```

### Criterios de aceptación

* No se accede directamente a `process.env` fuera de `config/environment.js`.
* Los secretos no se imprimen en logs.
* El ambiente de pruebas utiliza una base separada.
* Producción activa cookies seguras y configuración de proxy cuando corresponda.

---

## Fase 3: infraestructura HTTP

Se implementará el núcleo HTTP del boilerplate.

## Middlewares

Orden recomendado:

```text
1. Trust proxy
2. Request ID
3. Logging HTTP
4. Helmet
5. CORS
6. Compresión
7. Parsing JSON
8. Parsing cookies
9. Rate limiting general
10. Rutas
11. API 404
12. Frontend estático
13. Error handler
```

## Respuesta uniforme

### Éxito

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "019..."
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": []
  },
  "meta": {
    "requestId": "019..."
  }
}
```

## Catálogo inicial de errores

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
SESSION_EXPIRED
SESSION_REVOKED
FORBIDDEN
RESOURCE_NOT_FOUND
RESOURCE_CONFLICT
RATE_LIMIT_EXCEEDED
DATABASE_ERROR
INTERNAL_SERVER_ERROR
```

### Criterios de aceptación

* Ningún error interno expone stack trace en producción.
* Todo error contiene `requestId`.
* Las rutas `/api` desconocidas devuelven JSON.
* Los errores de Prisma se traducen a errores de aplicación.
* Las respuestas no dependen directamente de Prisma.

---

## Fase 4: persistencia y modelo inicial

Se configurará Prisma y el primer esquema MySQL.

## Entidades iniciales

```text
users
roles
permissions
user_roles
role_permissions
auth_sessions
audit_logs
```

## Modelo conceptual

```text
users
  └── user_roles
          └── roles
                └── role_permissions
                        └── permissions

users
  └── auth_sessions

users
  └── audit_logs
```

## Principios de diseño

* Relaciones muchos-a-muchos explícitas.
* Índices en claves foráneas.
* Restricciones únicas en códigos y correos.
* Metadatos de asignación.
* Roles del sistema protegidos.
* Sesiones revocables.
* Auditoría inmutable desde la API.

### Criterios de aceptación

```text
prisma migrate dev crea la base.
prisma migrate deploy funciona sin interacción.
prisma db seed puede ejecutarse varias veces.
Las relaciones cuentan con índices.
Los seeds no generan duplicados.
```

---

## Fase 5: modelo RBAC

El RBAC debe validar permisos, no nombres de roles.

## Permisos

Formato:

```text
users.read
users.create
users.update
users.change_status
users.assign_roles

roles.read
roles.create
roles.update
roles.delete
roles.assign_permissions

permissions.read

audit.read
sessions.read
sessions.revoke
```

## Roles iniciales

```text
SUPER_ADMIN
ADMIN
OPERATOR
READ_ONLY
```

Los nombres de roles podrán variar, pero los endpoints verificarán permisos concretos:

```js
authorize('users.update')
```

No:

```js
authorizeRole('ADMIN')
```

## Middleware esperado

```js
router.get(
  '/',
  authenticate,
  authorize('users.read'),
  usersController.list
);
```

### Reglas adicionales

* Un rol de sistema no podrá eliminarse.
* El superadministrador no debe quedar sin usuarios activos.
* Un usuario no debe eliminar su propio acceso administrativo accidentalmente.
* Los permisos se resolverán en el backend.
* La interfaz solo utilizará los permisos para adaptar la experiencia visual.

### Criterios de aceptación

* Un usuario sin permiso recibe `403`.
* Un usuario con permiso puede ejecutar la operación.
* Cambiar una asignación modifica el acceso efectivo.
* El backend no depende de controles del frontend.
* Cada permiso sensible cuenta con pruebas.

---

## Fase 6: autenticación y sesiones

## Flujo propuesto

```text
Login
  ↓
Validar credenciales
  ↓
Crear sesión en MySQL
  ↓
Emitir access token
  ↓
Emitir refresh token en cookie HttpOnly
```

## Access token

Debe contener solamente la información necesaria:

```json
{
  "sub": "123",
  "sid": "session-uuid",
  "securityVersion": 1
}
```

No conviene almacenar toda la lista de permisos como autoridad definitiva dentro del token.

## Refresh token

* Aleatorio y criptográficamente seguro.
* Almacenado en cookie `HttpOnly`.
* Solo su hash se almacena en MySQL.
* Rotado al renovar sesión.
* Revocable.
* Vinculado a una sesión.
* Con expiración independiente.

## Endpoints

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/auth/me
GET  /api/v1/auth/permissions
```

## Seguridad de credenciales

* Hash con Argon2id.
* Comparación mediante la librería.
* Rate limiting específico en login.
* Mensajes que no revelen si el usuario existe.
* Registro de intentos fallidos.
* Posibilidad de bloqueo posterior.
* Invalidación de sesiones al cambiar contraseña.

### Criterios de aceptación

```text
Un usuario válido inicia sesión.
Una contraseña incorrecta no revela información.
Un usuario inactivo no inicia sesión.
Un refresh token rotado no puede reutilizarse.
Logout revoca la sesión actual.
Logout-all revoca todas las sesiones.
```

---

## Fase 7: módulos administrativos

Se desarrollarán los módulos que demuestran el funcionamiento completo del boilerplate.

## Usuarios

```text
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id/status
PUT    /api/v1/users/:id/roles
```

## Roles

```text
GET    /api/v1/roles
GET    /api/v1/roles/:id
POST   /api/v1/roles
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id
PUT    /api/v1/roles/:id/permissions
```

## Permisos

```text
GET /api/v1/permissions
```

Los permisos normalmente se crean mediante migraciones o seeds, no desde una interfaz genérica, porque representan capacidades implementadas en código.

## Sesiones

```text
GET    /api/v1/sessions
DELETE /api/v1/sessions/:id
```

### Criterios de aceptación

* Paginación.
* Búsqueda.
* Ordenamiento limitado a columnas permitidas.
* Validaciones de negocio.
* Transacciones para asignaciones.
* Auditoría de operaciones sensibles.

---

## Fase 8: auditoría

El sistema debe registrar eventos relevantes, no cada lectura indiscriminadamente.

## Eventos iniciales

```text
AUTH.LOGIN_SUCCEEDED
AUTH.LOGIN_FAILED
AUTH.TOKEN_REFRESHED
AUTH.LOGOUT
AUTH.LOGOUT_ALL

USER.CREATED
USER.UPDATED
USER.STATUS_CHANGED
USER.ROLES_CHANGED
USER.PASSWORD_CHANGED

ROLE.CREATED
ROLE.UPDATED
ROLE.DELETED
ROLE.PERMISSIONS_CHANGED

SESSION.REVOKED
```

## Información registrada

```text
actorUserId
action
resourceType
resourceId
result
requestId
ipAddress
userAgent
metadata
createdAt
```

No se registrarán:

* Contraseñas.
* Tokens.
* Cookies.
* Secretos.
* Datos sensibles completos.

### Criterios de aceptación

* Cada operación administrativa genera auditoría.
* Los fallos relevantes también se registran.
* La auditoría no puede modificarse desde endpoints públicos.
* Los metadatos son JSON controlado.

---

## Fase 9: soporte para el frontend compilado

El backend no debe depender de una ubicación fija del proyecto frontend.

La integración se controlará con:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=/app/public
```

## Comportamiento

```text
/api/v1/*        API Express
/assets/*        Archivos compilados
/*               index.html de React
```

## Orden obligatorio

1. Registrar rutas de API.
2. Responder 404 para `/api`.
3. Servir archivos estáticos.
4. Aplicar fallback hacia `index.html`.
5. Ejecutar manejador de errores.

Esto evita que una API inexistente devuelva HTML.

## Caché

```text
index.html           no-cache
assets con hash      cache prolongada e immutable
```

### Criterios de aceptación

* El backend funciona con `SERVE_FRONTEND=false`.
* Producción sirve el directorio configurado.
* Recargar una ruta SPA no devuelve 404.
* `/api/v1/invalid` devuelve JSON 404.
* No existen rutas relativas acopladas a otro repositorio.

---

## Fase 10: pruebas automatizadas

## Unitarias

Cubrirán:

* Servicios.
* Reglas RBAC.
* Transformación de errores.
* Validación.
* Generación y verificación de tokens.
* Hash y comparación de contraseñas.

## Integración

Cubrirán:

* API con base de datos de pruebas.
* Login.
* Refresh.
* Logout.
* CRUD administrativo.
* Asignación de roles.
* Asignación de permisos.
* Auditoría.

## End-to-end

Escenarios principales:

```text
Crear usuario
Asignar rol
Iniciar sesión
Consumir endpoint autorizado
Retirar permiso
Confirmar rechazo HTTP 403
Revocar sesión
Confirmar rechazo de renovación
```

## Matriz mínima RBAC

| Escenario             | Resultado |
| --------------------- | --------: |
| Sin token             |       401 |
| Token inválido        |       401 |
| Sesión revocada       |       401 |
| Usuario inactivo      | 401 o 403 |
| Sin permiso           |       403 |
| Con permiso           |       2xx |
| Recurso inexistente   |       404 |
| Conflicto de unicidad |       409 |

### Criterios de aceptación

* Las pruebas no utilizan la base de desarrollo.
* Cada prueba deja el estado limpio.
* Los seeds de prueba son deterministas.
* Los permisos críticos tienen cobertura explícita.

---

## Fase 11: seguridad y endurecimiento

Se aplicarán:

* Helmet.
* Límite de tamaño JSON.
* CORS por lista blanca.
* Cookies `HttpOnly`, `Secure` y `SameSite`.
* Rate limiting.
* Validación de `Origin` en operaciones basadas en cookie.
* Sanitización de errores.
* Timeout controlado.
* Desactivación de `x-powered-by`.
* Reglas seguras de proxy.
* Límites de paginación.
* Lista permitida de campos de ordenamiento.
* Prevención de mass assignment.
* Transacciones cortas.
* Apagado ordenado del servidor.

## Apagado ordenado

Ante `SIGTERM` o `SIGINT`:

```text
1. Dejar de aceptar solicitudes.
2. Esperar solicitudes activas.
3. Desconectar Prisma.
4. Cerrar proceso.
```

### Criterios de aceptación

* El servidor no expone detalles internos.
* Los endpoints sensibles tienen rate limit.
* Las cookies cambian según el ambiente.
* La aplicación cierra conexiones correctamente.

---

## Fase 12: Docker, CI y despliegue

## Docker Compose de desarrollo

Servicios:

```text
api
mysql
```

Opcionalmente:

```text
adminer
```

## Dockerfile

Debe incluir:

* Imagen Node LTS.
* Instalación reproducible con `npm ci`.
* Usuario no root.
* `prisma generate`.
* Solo dependencias requeridas en producción.
* Health check.
* Comando de inicio.
* Directorio configurable para frontend estático.

## Pipeline CI

Orden recomendado:

```text
1. npm ci
2. npm run lint
3. npm test
4. prisma validate
5. Verificar migraciones
6. Construir imagen Docker
```

## Despliegue

```text
1. Aplicar migraciones
2. Ejecutar seeds seguros si corresponde
3. Iniciar nueva versión
4. Ejecutar health check
5. Habilitar tráfico
```

No se debe utilizar `prisma migrate dev` en producción.

---

# 5. Estrategia de documentación

El boilerplate debe explicar cómo extenderlo.

## `README.md`

* Requisitos.
* Instalación.
* Variables.
* Comandos.
* Migraciones.
* Seeds.
* Pruebas.
* Docker.
* Despliegue.

## Documentos técnicos

```text
docs/architecture.md
docs/authentication.md
docs/authorization.md
docs/database.md
docs/testing.md
docs/deployment.md
docs/creating-a-module.md
```

## Guía para crear un módulo

Debe indicar cómo agregar:

```text
module.routes.js
module.controller.js
module.service.js
module.repository.js
module.schemas.js
module.permissions.js
module.test.js
```

---

# 6. Orden concreto de implementación

El desarrollo debería ejecutarse en este orden:

```text
1. Bootstrap y convenciones
2. Variables de entorno
3. Express y manejo de errores
4. Logging y request ID
5. Prisma y MySQL
6. Modelo RBAC
7. Seeds
8. Autenticación
9. Sesiones
10. Middleware de autorización
11. Usuarios
12. Roles y permisos
13. Auditoría
14. Archivos estáticos
15. Pruebas completas
16. Docker
17. CI
18. Documentación final
```

Este orden evita construir controladores administrativos antes de tener lista la infraestructura de autenticación y autorización.

---

# 7. Hitos recomendados

## Hito 1: núcleo ejecutable

Incluye:

* Express.
* Configuración.
* Health check.
* Logging.
* Errores.
* Prisma conectado.

Resultado: API mínima operativa.

## Hito 2: seguridad funcional

Incluye:

* Usuarios.
* Sesiones.
* Login.
* Refresh.
* Logout.
* Middleware de autenticación.

Resultado: identidad y sesiones operativas.

## Hito 3: RBAC completo

Incluye:

* Roles.
* Permisos.
* Asignaciones.
* Middleware `authorize`.
* Seeds.
* Pruebas RBAC.

Resultado: autorización dinámica operativa.

## Hito 4: boilerplate administrable

Incluye:

* CRUD de usuarios.
* CRUD de roles.
* Matriz de permisos.
* Auditoría.
* Gestión de sesiones.

Resultado: backend base listo para consumir desde una interfaz.

## Hito 5: producto desplegable

Incluye:

* Archivos estáticos.
* Docker.
* CI.
* Pruebas completas.
* Documentación.

Resultado: plantilla lista para reutilización.

---

# 8. Definición de terminado

El backend podrá considerarse un boilerplate sólido cuando:

* Se pueda clonar e iniciar siguiendo únicamente el README.
* Las migraciones creen toda la estructura.
* Los seeds creen roles, permisos y administrador.
* La autenticación funcione con sesiones revocables.
* Cada endpoint sensible valide permisos.
* Los errores tengan formato uniforme.
* Las operaciones administrativas queden auditadas.
* Las pruebas cubran autenticación y RBAC.
* El servidor funcione con o sin frontend estático.
* La imagen Docker se ejecute como usuario no root.
* No existan secretos ni configuraciones específicas de una aplicación.
* Crear un nuevo módulo no requiera modificar el núcleo.

El primer bloque de ejecución debe ser **Fases 0 a 3**: convenciones, inicialización, configuración e infraestructura HTTP. Después podremos construir el modelo Prisma y RBAC sobre una base estable.
