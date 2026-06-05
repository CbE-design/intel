import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use the 'v1' API version and stable 'gemini-1.5-flash' model
 * to resolve persistent 404 handshake errors in the development environment.
 */
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1' })],
  model: 'googleai/gemini-1.5-flash',
});
