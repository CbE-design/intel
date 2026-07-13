---
name: Veritas Intel AI architecture
description: Groq is the only AI provider; all routes use groq-sdk; Genkit flows exist but are unused
---

## Rule
Use Groq (`groq-sdk`) exclusively for all AI analysis across the Veritas Intel platform. Model: `llama-3.3-70b-versatile`.

**Why:** User explicitly demanded Groq strictly; GROQ_API_KEY is the only AI secret stored. Google Gemini / Genkit flows exist in `artifacts/veritas-intel/src/ai/flows/` but nothing imports them from any .tsx file — they are dead code and should not be used.

**How to apply:**
- All AI calls flow through: frontend actions → `POST /api/intelligence/{chat,background-check,deep-search}` → `artifacts/api-server/src/routes/intelligence.ts` → `groq-sdk`
- The `intelligence.ts` file has quota-error detection (429 / rate limit) and graceful fallback to structured mock data when GROQ_API_KEY is absent
- Do NOT add Google AI, OpenAI, or any other provider to the API server
