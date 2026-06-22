import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * 
 * Standardized to use 'v1beta' for structured output support (JSON schemas).
 * Using 'gemini-1.5-flash' to ensure the most reliable connection 
 * across different environment regions.
 */
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1beta' })],
  model: 'googleai/gemini-1.5-flash',
});
