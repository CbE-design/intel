---
name: Veritas Intel DB Architecture
description: PostgreSQL migration from Firebase Firestore — key decisions and routing conventions
---

## Architecture

- **API Server** (`artifacts/api-server`): Express server, routes mounted at `/api` via `app.use("/api", router)`. Individual route files register at `/subjects`, `/research-reports`, etc.
- **Frontend** (`artifacts/veritas-intel`): Vite/React. API calls use `const BASE = '/api'` in `api-client.ts`. Custom hooks in `use-api.ts` wrap the client.
- **Database**: Replit PostgreSQL via `pg` Pool. Schema auto-initialized in `lib/db.ts` → `initSchema()` called from `app.ts` on startup.

## Key Tables
subjects, subject_locations, background_checks, audit_log, case_notes, research_reports

## Why
Firebase Firestore was replaced to use Replit's built-in PostgreSQL for persistence, avoiding external service credentials and improving reliability.

## How to apply
- All subject sub-resources are nested: `POST /subjects/:id/background-checks`, etc.
- `sanitizeForServer()` in utils.ts handles date serialization for Server Actions (no Firestore Timestamps anymore — all dates are ISO strings from the DB).
- `FirebaseErrorListener` and `firebase/` directory remain in the repo but are unused; `main.tsx` no longer wraps with `FirebaseClientProvider`.
