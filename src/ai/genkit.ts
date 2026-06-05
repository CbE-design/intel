
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use gemini15Flash for maximum API stability
 * in the current environment and to resolve 404 endpoint errors.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});
