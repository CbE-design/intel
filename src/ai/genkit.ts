
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use 'gemini-1.5-flash' to resolve 404 errors in the v1beta endpoint.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});
