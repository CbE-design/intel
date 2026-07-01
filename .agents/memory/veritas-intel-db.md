---
name: Veritas Intel DB Architecture
description: Durable decisions from Firebase→PostgreSQL migration — API pitfalls, key conventions
---

## Pitfall: 204 No Content responses
All DELETE endpoints return `204 No Content`. The `req()` helper in `api-client.ts` must check `res.status === 204` before calling `res.json()` — otherwise it throws `Unexpected end of JSON input`.

**Why:** Firebase never returns 204; migrating to REST APIs introduces this failure mode.

## Pitfall: AI env var must be consistent
The Replit secret is `GOOGLE_GENAI_API_KEY`. Both the guard checks AND `getGenAI()` in `intelligence.ts` must read this exact name. Using `GOOGLE_API_KEY` in client initialization while guarding on `GOOGLE_GENAI_API_KEY` creates a split-brain where the live path is entered but the client fails silently.

## Schema initialization
`initSchema()` uses `CREATE TABLE IF NOT EXISTS` — safe to call on every server startup. Called at top of `app.ts` before the server starts.

## How to apply
- All subject sub-collections are nested routes: e.g. `POST /subjects/:id/background-checks`
- Dates from the DB are ISO strings; `sanitizeForServer()` in utils.ts handles serialization for Server Actions
