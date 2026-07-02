---
name: Veritas Intel API & AI config
description: Key decisions for the api-server — env key names, Gemini model, esbuild externals, and sidebar quirks
---

## Google AI key
- Secret name in Replit is `GOOGLE_API_KEY` (not `GOOGLE_GENAI_API_KEY`)
- All `process.env` reads in `intelligence.ts` must use `GOOGLE_API_KEY`

## Gemini model
- Use `gemini-2.0-flash` — `gemini-1.5-flash` was retired from v1beta and returns 404
- `systemInstruction` must be passed to `getGenerativeModel({ model, systemInstruction })`, **not** to `startChat()` — passing it to `startChat` as a plain string causes a 400 Bad Request

## esbuild external list
- `pg` (postgres client) must be in the `external` array in `build.mjs` or the build fails with "Could not resolve pg"

## Sidebar
- `SidebarTrigger` in `page-header.tsx` must NOT be wrapped in `md:hidden` or desktop users can't toggle it
- Nav items must not have highlight classes (`bg-primary/5 border border-primary/20`) hardcoded in `className` — those make them always look active; use `isActive` prop only
