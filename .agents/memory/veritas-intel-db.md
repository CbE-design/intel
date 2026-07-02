---
name: Veritas Intel API & AI config
description: Key decisions for the api-server — env key names, Gemini model, esbuild externals, and sidebar quirks
---

## AI Provider — Groq (switched from Google Gemini)
- Secret name: `GROQ_API_KEY` (free tier, no billing — sign up at console.groq.com)
- Package: `groq-sdk` installed in `artifacts/api-server`
- Model: `llama-3.3-70b-versatile` — set in `chatComplete()` helper in `intelligence.ts`
- `groq-sdk` must be in the esbuild `external` list in `build.mjs` or the build fails
- Chat history mapping: Groq uses `"assistant"` role, not `"model"` — map accordingly
- Old `GOOGLE_API_KEY` / `@google/generative-ai` is no longer used for AI routes

## esbuild external list
- `pg` (postgres client) must be in the `external` array in `build.mjs` or the build fails with "Could not resolve pg"

## Sidebar
- `SidebarTrigger` in `page-header.tsx` must NOT be wrapped in `md:hidden` or desktop users can't toggle it
- Nav items must not have highlight classes (`bg-primary/5 border border-primary/20`) hardcoded in `className` — those make them always look active; use `isActive` prop only
