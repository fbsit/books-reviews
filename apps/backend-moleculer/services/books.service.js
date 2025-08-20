"use strict";

const DbMixin = require("../mixins/db.mixin");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema
 * @typedef {import('moleculer').Context} Context
 */

/** @type {ServiceSchema} */
module.exports = {
    name: "books",
    mixins: [DbMixin("books")],

    settings: {
        fields: [
            "_id",
            "title",
            "author",
            "year",
            "openLibraryKey",
            "coverBase64",
            "review",
            "rating",
            "userId",
            "createdAt",
            "updatedAt",
        ],
        entityValidator: {
            title: "string|min:1",
            author: { type: "string", optional: true },
            year: { type: "number", integer: true, optional: true },
            openLibraryKey: { type: "string", optional: true },
            coverBase64: { type: "string", optional: true },
            review: { type: "string", max: 500, optional: true },
            rating: { type: "number", integer: true, min: 1, max: 5, optional: true },
            userId: { type: "string", optional: true }
        },
    },

    actions: {
        // GET /api/books/detail/:id
        detail: {
            rest: "GET /books/detail/:id",
            params: { id: "string" },
            /** @param {Context} ctx */
            async handler(ctx) {
                const raw = ctx.params.id;
                const id = decodeURIComponent(raw);
                // Try library by _id first
                try {
                    const doc = await this.adapter.findById(id);
                    if (doc) {
                        return {
                            source: "library",
                            id: doc._id,
                            title: doc.title,
                            author: doc.author,
                            year: doc.year,
                            review: doc.review,
                            rating: doc.rating,
                            internalCoverUrl: `/api/books/library/front-cover/${doc._id}`,
                            openLibraryKey: doc.openLibraryKey
                        };
                    }
                } catch (e) { /* not a valid id or not found */ }

                // Otherwise, fetch from OpenLibrary by works/books key
                let key = id.startsWith("/") ? id : (id.startsWith("OL") ? `/works/${id}` : `/${id}`);
                if (!key.startsWith("/works/") && !key.startsWith("/books/")) {
                    // Fallback to search
                    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(id)}`;
                    const res = await fetch(url);
                    const json = await res.json();
                    const d = Array.isArray(json?.docs) && json.docs[0];
                    if (!d) return null;
                    key = d.key;
                }

                const workUrl = `https://openlibrary.org${key}.json`;
                const res = await fetch(workUrl);
                if (!res.ok) return null;
                const data = await res.json();
                let title = data.title;
                let year = (Array.isArray(data.first_publish_date) ? data.first_publish_date[0] : data.first_publish_date) || data.created?.value?.slice(0,4);
                if (typeof year === 'string') year = parseInt(year, 10);
                let coverUrl;
                const covers = data.covers || [];
                if (Array.isArray(covers) && covers.length > 0) {
                    coverUrl = `https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg`;
                }

                // If exists internally by key, prefer internal cover
                const found = await this.adapter.find({ query: { openLibraryKey: key } });
                const internal = found && found[0];
                return {
                    source: internal ? "library" : "openlibrary",
                    id: key,
                    title,
                    author: data.by_statement || (Array.isArray(data.authors) ? undefined : undefined),
                    year,
                    coverUrl,
                    internalCoverUrl: internal ? `/api/books/library/front-cover/${internal._id}` : undefined,
                    openLibraryKey: key
                };
            }
        },
        // GET /api/books/search?q=
        search: {
            rest: "GET /books/search",
            params: {
                q: { type: "string", optional: true },
                title: { type: "string", optional: true },
            },
            /** @param {Context} ctx */
            async handler(ctx) {
                const started = Date.now();
                const q = (ctx.params.q || ctx.params.title || "").trim();
                this.logger.info("[books.search]", { q });
                if (!q) return [];

                // Track last search per user
                try {
                    await ctx.call("searches.add", { q, userId: this._resolveUserId(ctx) });
                } catch (e) {
                    this.logger.warn("searches.add failed", e.message);
                }

                try {
                    const fetch = (global.fetch) ? global.fetch : require('node-fetch');
                    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`;
                    const res = await fetch(url);
                    const json = await res.json();
                    const docs = Array.isArray(json?.docs) ? json.docs.slice(0, 10) : [];

                    // Preload internal matches by openLibraryKey or title+author
                    const keys = docs.map(d => d.key).filter(Boolean);
                    const titles = docs.map(d => (d.title || "").toLowerCase());
                    const authors = docs.map(d => Array.isArray(d.author_name) ? (d.author_name[0] || "").toLowerCase() : "");

                    // Try to find by openLibraryKey first
                    let internalByKey = [];
                    if (keys.length) {
                        internalByKey = await this.adapter.find({ query: { openLibraryKey: { $in: keys } } });
                    }

                    const results = [];
                    for (let i = 0; i < docs.length; i++) {
                        const d = docs[i];
                        const key = d.key; // e.g. "/works/OL123..."
                        const title = d.title;
                        const author = Array.isArray(d.author_name) ? d.author_name[0] : undefined;
                        const year = d.first_publish_year;
                        let coverUrl;
                        if (d.cover_i) {
                            coverUrl = `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`;
                        }

                        let internal = internalByKey.find(b => b.openLibraryKey === key);
                        // fallback match by title+author if not found by key
                        if (!internal && title) {
                            const found = await this.adapter.find({ query: { title, author } });
                            internal = found && found[0];
                        }

                        results.push({
                            id: key || title,
                            title,
                            author,
                            year,
                            coverUrl,
                            internalCoverUrl: internal ? `/api/books/library/front-cover/${internal._id}` : undefined,
                        });
                    }

                    // persist search for current user
                    try {
                        const userId = this._resolveUserId(ctx);
                        if (q) await ctx.call('searches.add', { userId, q });
                    } catch (e) { this.logger.warn('persist search failed', e.message) }

                    const took = Date.now() - started;
                    this.logger.info("[books.search] completed", { q, results: results.length, tookMs: took });
                    return results;
                } catch (err) {
                    const took = Date.now() - started;
                    this.logger.error("[books.search] failed", { q, tookMs: took, err: err.message });
                    throw err;
                }
            },
        },

        // POST /api/books/my-library
        addToLibrary: {
            rest: "POST /books/my-library",
            params: {
                id: { type: "string", optional: true }, // external id (openlib key) optional
                title: "string|min:1",
                author: { type: "string", optional: true },
                year: { type: "number", integer: true, optional: true },
                openLibraryKey: { type: "string", optional: true },
                coverBase64: { type: "string", optional: true },
                review: { type: "string", optional: true, max: 500 },
                rating: { type: "number", integer: true, optional: true, min: 1, max: 5 },
            },
            /** @param {Context} ctx */
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const started = Date.now();
                const p = ctx.params;
                this.logger.info("[books.addToLibrary]", { title: p.title });

                if (p.review && p.review.length > 500) {
                    throw new Error("review too long");
                }
                if (p.rating != null && (p.rating < 1 || p.rating > 5)) {
                    throw new Error("rating out of range");
                }

                const entity = {
                    title: p.title,
                    author: p.author,
                    year: p.year,
                    openLibraryKey: p.openLibraryKey || p.id,
                    coverBase64: p.coverBase64,
                    review: p.review,
                    rating: p.rating,
                    userId: ctx.meta.user?.id ? String(ctx.meta.user.id) : null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const doc = await this.adapter.insert(entity);
                const json = await this.transformDocuments(ctx, {}, doc);
                // normalize id field for frontend convenience
                json.id = json._id;
                await this.entityChanged("created", json, ctx);
                const took = Date.now() - started;
                this.logger.info("[books.addToLibrary] created", { id: json._id, tookMs: took });
                return json;
            },
        },

        // GET /api/books/my-library/:id
        getFromLibrary: {
            rest: "GET /books/my-library/:id",
            params: { id: "string" },
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const started = Date.now();
                const doc = await this.adapter.findById(ctx.params.id);
                if (!doc) {
                    this.logger.warn("[books.getFromLibrary] not found", { id: ctx.params.id });
                    return null;
                }
                const requesterId = String(ctx.meta.user.id);
                if (doc.userId && String(doc.userId) !== requesterId) { ctx.meta.$statusCode = 404; return null; }
                const took = Date.now() - started;
                this.logger.info("[books.getFromLibrary]", { id: ctx.params.id, tookMs: took });
                return doc;
            },
        },

        // PUT /api/books/my-library/:id
        updateInLibrary: {
            rest: "PUT /books/my-library/:id",
            params: {
                id: "string",
                review: { type: "string", optional: true, max: 500 },
                rating: { type: "number", integer: true, optional: true, min: 1, max: 5 },
            },
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const started = Date.now();
                const { id, review, rating } = ctx.params;
                if (review != null && review.length > 500) throw new Error("review too long");
                if (rating != null && (rating < 1 || rating > 5)) throw new Error("rating out of range");
                const current = await this.adapter.findById(this._toObjectId(id));
                const requesterId = String(ctx.meta.user.id);
                if (!current || (current.userId && String(current.userId) !== requesterId)) { ctx.meta.$statusCode = 404; return null; }
                const update = { updatedAt: new Date() };
                if (review != null) update.review = review;
                if (rating != null) update.rating = rating;
                const doc = await this.adapter.updateById(this._toObjectId(id), { $set: update });
                const json = await this.transformDocuments(ctx, {}, doc);
                json.id = json._id;
                await this.entityChanged("updated", json, ctx);
                const took = Date.now() - started;
                this.logger.info("[books.updateInLibrary]", { id, tookMs: took });
                return json;
            },
        },

        // PUT /api/books/my-library/by-ol/:key
        updateByOpenLibraryKey: {
            rest: "PUT /books/my-library/by-ol/:key",
            params: {
                key: "string",
                review: { type: "string", optional: true, max: 500 },
                rating: { type: "number", integer: true, optional: true, min: 1, max: 5 },
            },
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const { key, review, rating } = ctx.params;
                const uidStr = String(ctx.meta.user.id);
                const found = await this.adapter.find({ query: { openLibraryKey: key, $or: [ { userId: uidStr }, { userId: this._toObjectId(uidStr) } ] } });
                const current = found && found[0];
                if (!current) { ctx.meta.$statusCode = 404; return null; }
                const update = { updatedAt: new Date() };
                if (review != null) update.review = review;
                if (rating != null) update.rating = rating;
                const doc = await this.adapter.updateById(current._id, { $set: update });
                const json = await this.transformDocuments(ctx, {}, doc);
                json.id = json._id;
                await this.entityChanged("updated", json, ctx);
                return json;
            }
        },

        // DELETE /api/books/my-library/:id
        removeFromLibrary: {
            rest: "DELETE /books/my-library/:id",
            params: { id: "string" },
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const started = Date.now();
                const id = ctx.params.id;
                console.log("id usado",id);
                const current = await this.adapter.findById(this._toObjectId(id));
                console.log("current",current);
                const requesterId = String(ctx.meta.user.id);
                if (!current || (current.userId && String(current.userId) !== requesterId)) { ctx.meta.$statusCode = 404; return null; }
                await this.adapter.removeById(this._toObjectId(id));
                await this.entityChanged("removed", { id }, ctx);
                const took = Date.now() - started;
                this.logger.info("[books.removeFromLibrary]", { id, tookMs: took });
                return { id };
            },
        },

        // GET /api/books/my-library
        listLibrary: {
            rest: "GET /books/my-library",
            params: {
                title: { type: "string", optional: true },
                author: { type: "string", optional: true },
                excludeNoReview: { type: "boolean", optional: true, convert: true },
                order: { type: "enum", values: ["asc", "desc"], optional: true },
            },
            async handler(ctx) {
                if (!ctx.meta.user?.id) { ctx.meta.$statusCode = 401; return { message: "unauthorized" }; }
                const q = {};
                const { title, author, excludeNoReview, order } = ctx.params;
                const uid = ctx.meta.user?.id;
                if (uid) {
                    const uidStr = String(uid);
                    q.$or = [ { userId: uidStr }, { userId: this._toObjectId(uidStr) } ];
                }
                if (title) q.title = new RegExp(title, "i");
                if (author) q.author = new RegExp(author, "i");
                if (excludeNoReview) q.review = { $exists: true, $ne: "" };
                const items = await this.adapter.find({ query: q });
                // add id alias
                items.forEach(i => { if (!i.id) i.id = i._id });
                if (order) {
                    items.sort((a, b) => {
                        const ra = a.rating ?? -Infinity;
                        const rb = b.rating ?? -Infinity;
                        return order === "asc" ? ra - rb : rb - ra;
                    });
                }
                this.logger.info("[books.listLibrary]", { count: items.length });
                return items;
            },
        },

        // GET /api/books/library/front-cover/:id
        frontCover: {
            rest: "GET /books/library/front-cover/:id",
            params: { id: "string" },
            async handler(ctx) {
                const book = await this.adapter.findById(ctx.params.id);
                if (!book || !book.coverBase64) {
                    ctx.meta.$statusCode = 404;
                    return "Not found";
                }
                const { mime, data } = parseDataUrl(book.coverBase64);
                ctx.meta.$responseType = mime || "image/jpeg";
                return Buffer.from(data, "base64");
            },
        },
    },

    methods: {
        _resolveUserId(ctx) {
            // If basic auth was used, username is in ctx.meta.user?.id
            const user = ctx.meta.user;
            if (user && user.id) return `user:${user.id}`;
            // fallback to IP
            const ip = ctx.meta.remoteAddress || ctx.meta.ip || "anonymous";
            return `ip:${ip}`;
        },
        _toObjectId(id) {
            try {
                const { ObjectId } = require('mongodb');
                if (typeof id === 'string' && id.length === 24) return new ObjectId(id);
                return id;
            } catch (_) { return id; }
        }
    },
};

function parseDataUrl(dataUrl) {
    try {
        if (!dataUrl.startsWith("data:")) return { mime: null, data: dataUrl };
        const [meta, base64] = dataUrl.split(",", 2);
        const mime = meta.substring(5, meta.indexOf(";"));
        return { mime, data: base64 };
    } catch (e) {
        return { mime: null, data: dataUrl };
    }
}


