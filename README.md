
## Books Reviews – Monorepo (Backend Moleculer + Frontend Nuxt 3)

Aplicación full‑stack para buscar libros, gestionar una biblioteca personal y escribir reseñas.

### Estructura

- `apps/backend-moleculer`: API y servicios (Moleculer + MongoDB)
- `apps/frontend-nuxt`: SPA en Nuxt 3 (Pinia, Sass)

### Requisitos

- Node.js 18+
- Yarn
- MongoDB en `mongodb://127.0.0.1:27017`

### Variables de entorno

- Backend
  - `MONGO_URI` (por defecto: `mongodb://127.0.0.1:27017/booksreviews`)
  - `PORT` (por defecto: `3001`)
- Frontend
  - `NUXT_PUBLIC_API_BASE` (por defecto: `http://localhost:3001`)

### Instalación

1) Backend
```bash
cd apps/backend-moleculer
yarn install
# Windows PowerShell
$env:MONGO_URI="mongodb://127.0.0.1:27017/booksreviews"; $env:PORT=3001; yarn dev
```

2) Frontend
```bash
cd apps/frontend-nuxt
yarn install
yarn dev
```

El frontend se abrirá en `http://localhost:3000` y consumirá la API en `http://localhost:3001/api`.

### Autenticación (solo Bearer)

- Registro: `POST /api/auth/register` (usuario/contraseña)
- Login: `POST /api/auth/login` → devuelve `{ token, user }`
- Logout: `POST /api/auth/logout`
- Perfil: `GET /api/auth/me`

El frontend guarda `auth.token` y `auth.user` en `localStorage` y los inyecta como `Authorization: Bearer <token>` en todas las llamadas mediante un plugin.

### Funcionalidad principal

- Buscar libros (OpenLibrary): `GET /api/books/search?q=...`
- Ver detalle (OpenLibrary o biblioteca interna): `GET /api/books/detail/:id`
- Biblioteca del usuario (requiere sesión):
  - Listar: `GET /api/books/my-library`
  - Agregar: `POST /api/books/my-library`
  - Obtener: `GET /api/books/my-library/:id`
  - Actualizar: `PUT /api/books/my-library/:id`
  - Eliminar: `DELETE /api/books/my-library/:id`
  - Actualizar por clave OpenLibrary: `PUT /api/books/my-library/by-ol/:key`
  - Portada interna: `GET /api/books/library/front-cover/:id`

### Frontend (Nuxt 3)

- Páginas: `pages/index.vue` (búsqueda), `pages/book/[id].vue` (detalle), `pages/library.vue` (biblioteca), `pages/login.vue`, `pages/register.vue`.
- Estado global con Pinia:
  - `stores/auth`: login/logout, persistencia de `token` y `user`.
  - `stores/search`: consulta, resultados y `history`; persistencia de `query` e `history`.
  - `stores/library`: libros del usuario; persistencia de `books`.
- Persistencia: `pinia-plugin-persistedstate` (`plugins/persistedstate.client.ts`).
- Inyección de fetch autenticado: `plugins/auth-fetch.ts` agrega `Authorization` si hay token y redirige a `/login` en 401.

### Backend (Moleculer)

- API Gateway: `services/api.service.js` en `/api` con CORS y autenticación opcional (Bearer o Basic si está configurado).
- Servicios:
  - `auth.service.js`: login/logout/me (token en memoria), verificación con `users.verify`.
  - `users.service.js`: registro, verificación de credenciales (bcrypt), seed opcional.
  - `books.service.js`: búsqueda en OpenLibrary, CRUD de biblioteca por usuario, portada interna.
  - `searches.service.js`: historial de últimas búsquedas por usuario/IP.
  - `docs.service.js`: OpenAPI JSON + UI.
  - `mixins/db.mixin.js`: acceso MongoDB (colecciones `books`, `users`, `searches`).

### Scripts útiles

- Backend
  - `yarn dev`: desarrollo con hot reload y REPL
  - `yarn start`: producción (runner)
  - `yarn cli`: REPL conectado
- Frontend
  - `yarn dev` | `yarn build` | `yarn preview`

### Flujo de uso

1. Regístrate o usa usuario por defecto si has seedado.
2. Inicia sesión (almacena token en el navegador).
3. Busca libros en la home y guarda en tu biblioteca.
4. Edita rating/reseña desde el detalle o la biblioteca.

### Notas

- Las portadas internas se sirven desde la API cuando se guardan con `coverBase64`.
- La persistencia en el cliente está limitada a estados de conveniencia (auth, búsqueda e items en memoria). Puedes desactivarla fácilmente por store.

