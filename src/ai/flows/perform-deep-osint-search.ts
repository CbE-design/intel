'use server';

/**
 * @fileOverview Deep OSINT Discovery Agent
 * 
 * Mimics GitHub tools like Sherlock and theHarvester to crawl digital footprints.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { performDeepOSINTDiscovery } from '@/lib/intelligence-service';

const DeepOSINTSearchInputSchema = z.object({
  name: z.string(),
  idNumber: z.string(),
  previousFindings: z.array(z.any()).optional(),
});

export type DeepOSINTSearchInput = z.infer<typeof DeepOSINTSearchInputSchema>;

const DeepOSINTSearchOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the deep OSINT findings.'),
  findings: z.array(z.object({
    platform: z.string(),
    status: z.string(),
    details: z.string(),
    evidence: z.string().optional(),
    confidence: z.number().min(0).max(100),
  })),
  overallRiskScore: z.number().min(0).max(100),
});

export type DeepOSINTSearchOutput = z.infer<typeof DeepOSINTSearchOutputSchema>;

const deepOSINTSearchPrompt = ai.definePrompt({
  name: 'deepOSINTSearchPrompt',
  input: {schema: DeepOSINTSearchInputSchema},
  output: {schema: DeepOSINTSearchOutputSchema},
  prompt: `You are an Advanced OSINT Discovery Agent.
  
  TASK: Perform a deep digital forensic search for the subject: {{{name}}} (ID: {{{idNumber}}}).
  
  CONTEXT:
  You have access to simulated high-depth intelligence tools that mimic repositories like Sherlock (username discovery), theHarvester (email/subdomain harvesting), and global breach datasets.
  
  GUIDELINES:
  1. Synthesize the raw discovery data into a professional investigative narrative.
  2. Highlight any "Red Flags" found in digital footprints (leaks, domain registrations, or social anomalies).
  3. Provide a confidence score for each finding.
  4. The "summary" should be concise but technically dense (minimum 2 paragraphs).
  
  INPUT DATA:
  {{{#if previousFindings}}}
  Previous findings to cross-reference:
  {{#each previousFindings}}
  - Platform: {{{this.platform}}}, Status: {{{this.status}}}, Details: {{{this.details}}}
  {{/each}}
  {{/if}}
  
  Analyze the digital persona and provide the final intelligence dossier.`,
});

export async function performDeepOSINTSearch(input: DeepOSINTSearchInput): Promise<DeepOSINTSearchOutput> {
  // Step 1: Trigger the "Deep Crawler" tool simulation
  const rawFindings = await performDeepOSINTDiscovery(input.name, input.idNumber);
  
  // Step 2: Use AI to synthesize and score the findings
  const {output} = await deepOSINTSearchPrompt({
    ...input,
    previousFindings: rawFindings,
  });

  if (!output) {
    throw new Error('AI failed to synthesize deep OSINT findings.');
  }

  return {
    ...output,
    findings: output.findings.map(f => ({
      ...f,
      // Ensure we merge the AI's scoring with the raw simulated data where applicable
      evidence: rawFindings.find(raw => raw.platform === f.platform)?.evidence || f.evidence
    }))
  };
}
