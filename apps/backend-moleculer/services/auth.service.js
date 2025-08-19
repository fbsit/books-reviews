"use strict";

const crypto = require("crypto");

/** @type {import('moleculer').ServiceSchema} */
module.exports = {
    name: "auth",
    actions: {
        // POST /api/auth/login
        login: {
            rest: "POST /auth/login",
            params: { username: "string", password: "string" },
            async handler(ctx) {
                const user = await ctx.call("users.verify", ctx.params);
                if (!user) {
                    ctx.meta.$statusCode = 401;
                    return { message: "invalid_credentials" };
                }
                const token = this._issueToken(user);
                this.tokens.set(token, { user, createdAt: Date.now() });
                return { token, user };
            }
        },
        // POST /api/auth/logout
        logout: {
            rest: "POST /auth/logout",
            params: {},
            async handler(ctx) {
                const auth = ctx.meta.authorization || ctx.meta.headers?.authorization;
                const token = this._extractBearer(auth);
                if (token) this.tokens.delete(token);
                return { ok: true };
            }
        },
        me: {
            rest: "GET /auth/me",
            async handler(ctx) {
                const auth = ctx.meta.authorization || ctx.meta.headers?.authorization;
                const token = this._extractBearer(auth);
                const rec = token && this.tokens.get(token);
                if (!rec) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                return rec.user;
            }
        }
    },
    created() {
        this.tokens = new Map();
    },
    methods: {
        _issueToken(user) { return crypto.randomBytes(24).toString("hex"); },
        _extractBearer(header) {
            if (!header) return null;
            if (typeof header !== "string") return null;
            if (!header.startsWith("Bearer ")) return null;
            return header.slice(7);
        }
    }
}


