---
name: Veritas Intel Port Decisions
description: Key decisions made when porting Veritas Intel from Next.js to Vite+React in Replit monorepo
---

## Architecture

- Frontend: `artifacts/veritas-intel` — React + Vite (wouter routing, shadcn/ui, Tailwind v4)
- Backend: `artifacts/api-server` — Express with 3 AI routes at `/api/intelligence/*`
- Database: Firebase (Firestore + anonymous Auth) — no Postgres needed
- AI: `@google/generative-ai` (gemini-1.5-flash) in api-server, NOT genkit (too many OpenTelemetry transitive deps that failed at runtime on Node 24)

**Why not genkit in api-server:** Genkit 1.39 requires many `@opentelemetry/*` packages not bundled with it; they must be installed manually and still fail. Switched to `@google/generative-ai` directly.

**How to apply:** If AI routes need enhancement, use `@google/generative-ai` SDK, not genkit, in the api-server.

## Key Next.js → Vite Migrations

- `next/link` → wouter `Link`
- `useRouter` / `usePathname` → wouter `useLocation`
- `useParams` → wouter `useParams`
- `notFound()` → `navigate('/subjects')`
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- `next-themes` → removed; sonner hardcoded to `theme="dark"`
- `'use server'` / `'use client'` → harmless comment strings in Vite (not removed)
- `app/layout.tsx` → stubbed (layout handled by main.tsx + FirebaseClientProvider)
- Server actions (`generateReportAction`, `performDeepSearchAction`) → async functions calling `/api/intelligence/*`

## CSS Theme

Tailwind v4 with `@theme inline` in index.css. Monochrome black/white theme:
- Light: background `0 0% 100%`, foreground `0 0% 0%`, primary `0 0% 0%`
- Dark: background `0 0% 2%`, foreground `0 0% 98%`, primary `0 0% 100%`

## Environment Variables Needed

- `VITE_GOOGLE_MAPS_API_KEY` — for location map (gracefully degraded if missing)
- `GOOGLE_GENAI_API_KEY` — for AI routes in api-server (mock responses if missing)
- Firebase config vars (already in firebase/config.ts or env)
