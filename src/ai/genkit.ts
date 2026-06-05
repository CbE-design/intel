import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use the 'gemini-1.5-flash-latest' string identifier.
 * This resolves the 404 errors encountered with the standard alias in the v1beta endpoint.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
});
