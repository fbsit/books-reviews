"use strict";

const DbMixin = require("../mixins/db.mixin");
const bcrypt = require("bcryptjs");

/** @type {import('moleculer').ServiceSchema} */
module.exports = {
    name: "users",
    mixins: [DbMixin("users")],
    settings: {
        fields: ["_id", "username", "passwordHash", "createdAt"],
        entityValidator: {
            username: "string|min:3",
            passwordHash: "string|min:6"
        }
    },
    actions: {
        register: {
            rest: "POST /auth/register",
            params: { username: "string|min:3", password: "string|min:6" },
            async handler(ctx) {
                const { username, password } = ctx.params;
                const exists = await this.adapter.find({ query: { username } });
                if (exists && exists[0]) {
                    ctx.meta.$statusCode = 409;
                    return { message: "username_taken" };
                }
                const salt = await bcrypt.genSalt(8);
                const passwordHash = await bcrypt.hash(password, salt);
                const doc = await this.adapter.insert({ username, passwordHash, createdAt: new Date() });
                return { id: doc._id, username: doc.username };
            }
        },
        verify: {
            params: { username: "string", password: "string" },
            async handler(ctx) {
                const { username, password } = ctx.params;
                const users = await this.adapter.find({ query: { username } });
                const user = users && users[0];
                if (!user) return null;
                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;
                return { id: user._id, username: user.username };
            }
        }
    },
    methods: {
        async seedDB() {
            const salt = await bcrypt.genSalt(8);
            const hash = await bcrypt.hash(process.env.DEFAULT_USER_PASS || "demo123", salt);
            await this.adapter.insert({ username: process.env.DEFAULT_USER || "demo", passwordHash: hash, createdAt: new Date() });
        }
    }
}


