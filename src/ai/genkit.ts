import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use 'v1beta' for structured output support (JSON schemas).
 */
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1beta' })],
  model: 'googleai/gemini-1.5-flash',
});
