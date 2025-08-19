"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema
 * @typedef {import('moleculer').Context} Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "docs",
	actions: {
		// Serves the OpenAPI (Swagger) JSON
		openapi: {
			rest: "GET /openapi.json",
			/** @param {Context} ctx */
			handler(ctx) {
				const serverUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
				return buildOpenApiSpec(serverUrl);
			}
		},
		// Serves a minimal Swagger UI pointing to /api/openapi.json
		ui: {
			rest: "GET /docs",
			/** @param {Context} ctx */
			handler(ctx) {
				ctx.meta.$responseType = "text/html; charset=utf-8";
				return `<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Books API – Swagger</title>
  <link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css\" />
</head>
<body>
  <div id=\"swagger-ui\"></div>
  <script src=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js\"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>`;
			}
		}
	}
};

function buildOpenApiSpec(serverUrl) {
	return {
		openapi: "3.0.3",
		info: {
			title: "Books Reviews API",
			version: "1.0.0"
		},
		servers: [ { url: serverUrl + "/api" } ],
		components: {
			securitySchemes: {
				basicAuth: { type: "http", scheme: "basic" },
				bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "token" }
			},
			schemas: {
				User: { type: "object", properties: { id: { type: "string" }, username: { type: "string" } }, required: ["id", "username"] },
				BookSearchItem: {
					type: "object",
					properties: {
						id: { type: "string" },
						title: { type: "string" },
						author: { type: "string", nullable: true },
						year: { type: "integer", nullable: true },
						coverUrl: { type: "string", nullable: true },
						internalCoverUrl: { type: "string", nullable: true }
					},
					required: ["id", "title"]
				},
				LibraryBook: {
					type: "object",
					properties: {
						_id: { type: "string" },
						title: { type: "string" },
						author: { type: "string", nullable: true },
						year: { type: "integer", nullable: true },
						openLibraryKey: { type: "string", nullable: true },
						coverBase64: { type: "string", nullable: true },
						review: { type: "string", nullable: true, maxLength: 500 },
						rating: { type: "integer", minimum: 1, maximum: 5, nullable: true },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" }
					},
					required: ["_id", "title"]
				},
				SaveLibraryBookInput: {
					type: "object",
					properties: {
						id: { type: "string", nullable: true },
						title: { type: "string" },
						author: { type: "string", nullable: true },
						year: { type: "integer", nullable: true },
						openLibraryKey: { type: "string", nullable: true },
						coverBase64: { type: "string", nullable: true },
						review: { type: "string", nullable: true, maxLength: 500 },
						rating: { type: "integer", minimum: 1, maximum: 5, nullable: true }
					},
					required: ["title"]
				},
				UpdateLibraryBookInput: {
					type: "object",
					properties: {
						review: { type: "string", maxLength: 500 },
						rating: { type: "integer", minimum: 1, maximum: 5 }
					}
				}
			}
		},
		security: [],
		paths: {
			"/auth/login": { post: { summary: "Iniciar sesión", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, password: { type: "string" } }, required: ["username", "password"] } } } }, responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" }, user: { $ref: "#/components/schemas/User" } }, required: ["token", "user"] } } } }, "401": { description: "Credenciales inválidas" } } } },
			"/auth/logout": { post: { summary: "Cerrar sesión", responses: { "200": { description: "OK" } } } },
			"/auth/me": { get: { summary: "Usuario actual", responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, "401": { description: "No autorizado" } } } },
			"/auth/register": { post: { summary: "Registrar usuario", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { username: { type: "string" }, password: { type: "string" } }, required: ["username", "password"] } } } }, responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, "409": { description: "Usuario existente" } } } },
			"/books/search": {
				get: {
					summary: "Buscar libros en OpenLibrary",
					parameters: [ { name: "q", in: "query", required: true, schema: { type: "string" } } ],
					responses: {
						"200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BookSearchItem" } } } } }
					}
				}
			},
			"/books/detail/{id}": { get: { summary: "Detalle de un libro por ID (interno o OpenLibrary)", parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ], responses: { "200": { description: "OK" }, "404": { description: "No encontrado" } } } },
			"/books/last-search": {
				get: {
					summary: "Últimas 5 búsquedas del usuario",
					responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { type: "string" } } } } } }
				}
			},
			"/books/my-library": {
				get: {
					summary: "Listar libros guardados",
					parameters: [
						{ name: "title", in: "query", required: false, schema: { type: "string" } },
						{ name: "author", in: "query", required: false, schema: { type: "string" } },
						{ name: "excludeNoReview", in: "query", required: false, schema: { type: "boolean" } },
						{ name: "order", in: "query", required: false, schema: { type: "string", enum: ["asc", "desc"] } }
					],
					responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/LibraryBook" } } } } } }
				},
				post: {
					summary: "Guardar libro en biblioteca",
					requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SaveLibraryBookInput" } } } },
					responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LibraryBook" } } } } }
				}
			},
			"/books/my-library/{id}": {
				get: {
					summary: "Obtener libro por ID",
					parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
					responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LibraryBook" } } } }, "404": { description: "Not Found" } }
				},
				put: {
					summary: "Actualizar review y calificación",
					parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
					requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateLibraryBookInput" } } } },
					responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LibraryBook" } } } } }
				},
				delete: {
					summary: "Eliminar libro",
					parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
					responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" } } } } } } }
				}
			},
			"/books/library/front-cover/{id}": {
				get: {
					summary: "Portada interna en base64",
					parameters: [ { name: "id", in: "path", required: true, schema: { type: "string" } } ],
					responses: { "200": { description: "Imagen" }, "404": { description: "Not Found" } }
				}
			}
		}
	};
}


