import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * 
 * Standardized to use 'gemini-1.5-flash' for structured output support.
 * The API version is managed by the plugin to ensure compatibility.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});
