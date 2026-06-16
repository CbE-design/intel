import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use 'v1beta' for structured output support (JSON schemas).
 * Using 'gemini-1.5-flash' for the most reliable handshake in this environment.
 */
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1beta' })],
  model: 'googleai/gemini-1.5-flash',
});
