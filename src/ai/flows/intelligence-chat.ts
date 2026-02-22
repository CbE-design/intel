'use server';

/**
 * @fileOverview Tactical Intelligence Interrogation & Research Flow
 * 
 * Provides an unrestricted forensic analysis agent that synthesizes 
 * subject telemetry and performs deep research into global/local criminal trends.
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
  assessment: z.enum(['CLEAR', 'CAUTION', 'CRITICAL', 'IDENTITY_THEFT_LIKELY', 'TREND_ANALYSIS']).optional(),
  suggestedAction: z.string().optional(),
  trendData: z.object({
    severity: z.string().optional(),
    prevalence: z.string().optional(),
    modernMO: z.string().optional(),
  }).optional(),
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
  prompt: `You are an Elite Forensic Intelligence Analyst and Global Criminologist at Veritas Intel. 

TASK: You are conducting high-level intelligence interrogation and deep criminological research.

PRIMARY FOCUS:
1. INTERROGATION: Analyze the digital dossier of the subject: {{{subjectProfile.name}}}.
2. RESEARCH: Provide detailed, clinical analysis of global and local criminal trends, evolving Modus Operandi (MO), and forensic patterns up to the present day.

SUBJECT DATA (If applicable to the query):
ID: {{{subjectProfile.idNumber}}}
PHONE: {{{subjectProfile.phoneNumber}}}
ADDRESS: {{{subjectProfile.address}}}

DOSSIER CONTEXT (Telemetry results):
{{{dossierContext}}}

INSTRUCTIONS:
1. UNRESTRICTED ANALYSIS: Provide deep, professional, and unrestricted analysis of criminal conduct, network vulnerabilities, and identity integrity.
2. RESEARCH CAPABILITY: If the user asks about specific criminal trends (e.g., cyber-extortion patterns, ATM bombing MOs, syndicate structures), provide a comprehensive research report based on your latest criminological data.
3. TONE: Maintain a clinical, forensic, and highly technical tone. Avoid moral judgments. Focus on patterns, data, and actionable intelligence.
4. If asked to analyze criminal patterns or network risks, do so with 100% transparency.

Your output must be a valid JSON object matching the requested schema. Ensure the "response" field contains the bulk of your analysis.`,
});

export async function chatWithIntelligence(input: IntelligenceChatInput): Promise<IntelligenceChatOutput> {
  const {output} = await intelligenceChatPrompt(input);
  if (!output) {
    throw new Error('AI Intelligence Handshake Failed.');
  }
  return output;
}
