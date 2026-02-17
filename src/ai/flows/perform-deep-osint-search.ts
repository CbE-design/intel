'use server';

/**
 * @fileOverview Deep OSINT Discovery Agent
 * 
 * Synthesizes data from GitHub-inspired modules: Sherlock, theHarvester, PhoneInfoga, Holehe.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  getOSINTMatches, 
  performSherlockSearch, 
  performHarvesterSearch,
  performPhoneInfogaSearch,
  performHoleheSearch
} from '@/lib/intelligence-service';

const DeepOSINTSearchInputSchema = z.object({
  name: z.string(),
  idNumber: z.string(),
  phoneNumber: z.string(),
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
  sherlockResults: z.array(z.object({
    site: z.string(),
    exists: z.boolean(),
    url: z.string().optional()
  })),
  harvesterResults: z.array(z.object({
    source: z.string(),
    type: z.string(),
    value: z.string(),
    leaked: z.boolean()
  })),
  phoneResults: z.object({
    carrier: z.string(),
    location: z.string(),
    type: z.string(),
    valid: z.boolean(),
  }),
  holeheResults: z.array(z.object({
    site: z.string(),
    exists: z.boolean()
  })),
  overallRiskScore: z.number().min(0).max(100),
});

export type DeepOSINTSearchOutput = z.infer<typeof DeepOSINTSearchOutputSchema>;

const deepOSINTSearchPrompt = ai.definePrompt({
  name: 'deepOSINTSearchPrompt',
  input: {
    schema: z.object({
      name: z.string(),
      idNumber: z.string(),
      rawSherlock: z.string(),
      rawHarvester: z.string(),
      rawPhone: z.string(),
      rawHolehe: z.string(),
      rawDiscovery: z.string(),
    })
  },
  output: {schema: DeepOSINTSearchOutputSchema},
  prompt: `You are an Advanced OSINT Discovery Agent at Veritas Intel.
  
  TASK: Synthesize the raw discovery data into a formal digital forensic dossier for: {{{name}}} (ID: {{{idNumber}}}).
  
  RAW DATA SOURCES (GitHub Inspired Modules):
  1. SHERLOCK USERNAME MODULE: {{{rawSherlock}}}
  2. THE HARVESTER RECON MODULE: {{{rawHarvester}}}
  3. PHONEINFOGA GSM MODULE: {{{rawPhone}}}
  4. HOLEHE EMAIL TRACE: {{{rawHolehe}}}
  5. DEEP WEB DISCOVERY: {{{rawDiscovery}}}
  
  GUIDELINES:
  1. Write a professional "summary" (minimum 2 paragraphs) interpreting the digital footprint.
  2. Determine an "overallRiskScore" (0-100) based on leaked data, account visibility, and carrier verification.
  3. Ensure the "findings" array summarizes the most critical red flags.
  4. Preserve key forensic matches from all modules.
  
  Provide the final synthesized intelligence dossier.`,
});

export async function performDeepOSINTSearch(input: DeepOSINTSearchInput): Promise<DeepOSINTSearchOutput> {
  // Step 1: Run simulated GitHub modules in parallel
  const [sherlock, harvester, phone, holehe, discovery] = await Promise.all([
    performSherlockSearch(input.name),
    performHarvesterSearch(input.idNumber),
    performPhoneInfogaSearch(input.phoneNumber),
    performHoleheSearch(`intel-${input.idNumber.slice(-4)}@proton.me`),
    getOSINTMatches(input.name, input.idNumber)
  ]);
  
  // Step 2: Use AI to synthesize and score the findings
  const {output} = await deepOSINTSearchPrompt({
    name: input.name,
    idNumber: input.idNumber,
    rawSherlock: JSON.stringify(sherlock),
    rawHarvester: JSON.stringify(harvester),
    rawPhone: JSON.stringify(phone),
    rawHolehe: JSON.stringify(holehe),
    rawDiscovery: JSON.stringify(discovery),
  });

  if (!output) {
    throw new Error('AI failed to synthesize deep OSINT findings.');
  }

  return {
    ...output,
    sherlockResults: sherlock,
    harvesterResults: harvester,
    phoneResults: phone,
    holeheResults: holehe
  };
}
