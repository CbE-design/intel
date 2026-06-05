import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * Standardized to use the stable string identifier for Gemini 1.5 Flash.
 * This resolves the build error regarding non-existent exports and 
 * provides a reliable handshake with the generative language API.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});
