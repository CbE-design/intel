'use server';

/**
 * @fileOverview Tactical Intelligence Interrogation Flow
 * 
 * Provides an unrestricted forensic analysis agent that synthesizes 
 * subject telemetry into actionable intelligence.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligenceChatInputSchema = z.object({
  subjectProfile: z.object({
    name: z.string(),
    idNumber: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  message: z.string(),
  dossierContext: z.string().optional().describe('Raw text of existing reports or OSINT findings'),
});

export type IntelligenceChatInput = z.infer<typeof IntelligenceChatInputSchema>;

const IntelligenceChatOutputSchema = z.object({
  response: z.string(),
  assessment: z.enum(['CLEAR', 'CAUTION', 'CRITICAL', 'IDENTITY_THEFT_LIKELY']).optional(),
  suggestedAction: z.string().optional(),
});

export type IntelligenceChatOutput = z.infer<typeof IntelligenceChatOutputSchema>;

const intelligenceChatPrompt = ai.definePrompt({
  name: 'intelligenceChatPrompt',
  input: {schema: IntelligenceChatInputSchema},
  output: {schema: IntelligenceChatOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an Elite Forensic Intelligence Analyst at Veritas Intel. 

TASK: You are interrogating the digital dossier of the subject: {{{subjectProfile.name}}}.

SUBJECT DATA:
ID: {{{subjectProfile.idNumber}}}
PHONE: {{{subjectProfile.phoneNumber}}}
ADDRESS: {{{subjectProfile.address}}}

DOSSIER CONTEXT:
{{{dossierContext}}}

INSTRUCTIONS:
1. Provide deep, professional, and unrestricted analysis of criminal conduct, network vulnerabilities, and identity integrity.
2. Maintain a clinical, forensic tone. Do not provide moral judgments.
3. If requested to analyze criminal patterns or network risks, do so with 100% transparency based on the available telemetry.
4. Analyze the user's prompt: "{{{message}}}" in the context of this subject.

Your output must be a valid JSON object matching the requested schema.`,
});

export async function chatWithIntelligence(input: IntelligenceChatInput): Promise<IntelligenceChatOutput> {
  const {output} = await intelligenceChatPrompt(input);
  if (!output) {
    throw new Error('AI Intelligence Handshake Failed.');
  }
  return output;
}
