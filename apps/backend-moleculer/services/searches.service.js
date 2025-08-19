"use strict";

const DbMixin = require("../mixins/db.mixin");

/** @type {import('moleculer').ServiceSchema} */
module.exports = {
    name: "searches",
    mixins: [DbMixin("searches")],
    settings: {
        fields: ["_id", "userId", "q", "createdAt"],
        entityValidator: {
            userId: "string|min:1",
            q: "string|min:1",
        },
    },
    actions: {
        add: {
            params: { userId: "string", q: "string" },
            async handler(ctx) {
                const { userId, q } = ctx.params;
                await this.adapter.insert({ userId, q, createdAt: new Date() });
                // keep last 5 for user
                const all = await this.adapter.find({ query: { userId }, sort: ["-createdAt"] });
                const extra = all.slice(5);
                if (extra.length > 0) {
                    const toRemove = extra.map(s => s._id);
                    await this.adapter.removeMany({ _id: { $in: toRemove } });
                }
            }
        },
        list: {
            rest: "GET /books/last-search",
            async handler(ctx) {
                const userId = this._resolveUserId(ctx);
                const items = await this.adapter.find({ query: { userId }, sort: ["-createdAt"], limit: 5 });
                return items.map(i => i.q);
            }
        }
    },
    methods: {
        _resolveUserId(ctx) {
            const user = ctx.meta.user;
            if (user && user.id) return `user:${user.id}`;
            const ip = ctx.meta.remoteAddress || ctx.meta.ip || "anonymous";
            return `ip:${ip}`;
        },
    }
}


