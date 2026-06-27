import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit Intelligence Configuration
 * 
 * Standardized to use 'gemini-1.5-flash' with v1beta to support structured output.
 * v1beta is required for responseMimeType and responseSchema support.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiVersion: 'v1beta' })
  ],
  model: 'googleai/gemini-1.5-flash',
});
