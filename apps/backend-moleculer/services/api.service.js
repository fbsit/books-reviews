"use strict";

const ApiGateway = require("moleculer-web");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 * @typedef {import('moleculer-web').ApiSettingsSchema} ApiSettingsSchema API Setting Schema
 */

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	/** @type {ApiSettingsSchema}  */
	settings: {
		// Exposed port
		port: process.env.PORT || 3001,

		// Exposed IP
		ip: "0.0.0.0",

		// Global Express middlewares.
		use: [
			(req, res, next) => {
				const start = Date.now();
				res.on("finish", () => {
					const took = Date.now() - start;
					const { method, url } = req;
					const status = res.statusCode;
					req.$service && req.$service.logger && req.$service.logger.info("[HTTP]", { method, url, status, tookMs: took });
				});
				next();
			}
		],

		routes: [
			{
				path: "/api",
				cors: {
					origin: [process.env.CORS_ORIGIN || "*"],
					methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
					allowedHeaders: ["Content-Type", "Authorization"],
					credentials: false,
					maxAge: 3600
				},

				whitelist: [
					"**"
				],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: true,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: false,

				// Use explicit aliases to avoid conflicts with moleculer-db default REST routes
				autoAliases: false,

				aliases: {
					"GET books/search": "books.search",
					"GET books/detail/:id": "books.detail",
					"GET books/last-search": "searches.list",
					"POST books/my-library": "books.addToLibrary",
					"GET books/my-library": "books.listLibrary",
					"GET books/my-library/:id": "books.getFromLibrary",
					"PUT books/my-library/:id": "books.updateInLibrary",
					"PUT books/my-library/by-ol/:key": "books.updateByOpenLibraryKey",
					"DELETE books/my-library/:id": "books.removeFromLibrary",
					"GET books/library/front-cover/:id": "books.frontCover",
					"POST auth/login": "auth.login",
					"POST auth/logout": "auth.logout",
					"GET auth/me": "auth.me",
					"POST auth/register": "users.register",
					"GET openapi.json": "docs.openapi",
					"GET docs": "docs.ui"
				},

				/**
				 * Before call hook. You can check the request.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingRequest} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				 *
				onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				}, */

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingRequest} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true
			}
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,


		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {}
		}
	},

	methods: {

		/**
		 * Authenticate the request. It check the `Authorization` token value in the request header.
		 * Check the token value & resolve the user by the token.
		 * The resolved user will be available in `ctx.meta.user`
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authenticate(ctx, route, req) {
			const header = req.headers["authorization"]; 
			// Try Bearer token via auth service
			if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
				try {
					const me = await ctx.call('auth.me', {}, { meta: { authorization: header } });
					if (me) { ctx.meta.user = { id: me.id, username: me.username }; return ctx.meta.user; }
				} catch (e) { /* ignore, fall through to anonymous */ }
			}
			// Allow anonymous and capture IP
			ctx.meta.ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
			return null;
		},

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authorize(ctx, route, req) {
			// Get the authenticated user.
			const user = ctx.meta.user;

			// It check the `auth` property in action schema.
			if (req.$action.auth == "required" && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
		}

	}
};
