'use server';

/**
 * @fileOverview Authentic Deep OSINT Discovery Agent
 * 
 * Orchestrates real-time modules inspired by Sherlock, theHarvester, PhoneInfoga, and Holehe.
 * Synthesizes cross-referenced telemetry into a formal digital dossier.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  getOSINTMatches, 
  performSherlockSearch, 
  performHarvesterSearch,
  performPhoneInfogaSearch,
  performHoleheSearch,
  performRICAReview
} from '@/lib/intelligence-service';

const DeepOSINTSearchInputSchema = z.object({
  name: z.string(),
  idNumber: z.string(),
  phoneNumber: z.string(),
});

export type DeepOSINTSearchInput = z.infer<typeof DeepOSINTSearchInputSchema>;

const DeepOSINTSearchOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the real-time OSINT and RICA findings.'),
  findings: z.array(z.object({
    platform: z.string(),
    status: z.string(),
    details: z.string(),
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
  ricaResults: z.object({
    status: z.string(),
    registeredName: z.string(),
    registeredId: z.string(),
    provider: z.string(),
  }),
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
      rawRica: z.string(),
      rawDiscovery: z.string(),
    })
  },
  output: {schema: DeepOSINTSearchOutputSchema},
  prompt: `You are an Advanced Intelligence Discovery Agent at Veritas Intel.
  
  TASK: Synthesize real-time telemetry from four GitHub OSINT modules and a South African RICA review into a digital forensic dossier.
  
  SUBJECT: {{{name}}} (ID: {{{idNumber}}})
  
  TELEMETRY INPUTS:
  1. SHERLOCK USERNAME CRAWL: {{{rawSherlock}}}
  2. THE HARVESTER LEAK RECON: {{{rawHarvester}}}
  3. PHONEINFOGA GSM ANALYSIS: {{{rawPhone}}}
  4. HOLEHE EMAIL IDENTITY TRACE: {{{rawHolehe}}}
  5. RICA REGISTRATION STATUS: {{{rawRica}}}
  6. DEEP WEB DISCOVERY: {{{rawDiscovery}}}
  
  INSTRUCTIONS:
  1. Analyze RICA alignment. If the registered owner differs from the subject, mark as CRITICAL risk.
  2. Evaluate the digital footprint size. Large, unverified footprints without RICA alignment are HIGH risk.
  3. Provide a professional, long-form executive "summary".
  4. Calculate an "overallRiskScore" (0-100) reflecting identity confidence.
  
  Ensure your synthesis is technically precise and mirrors professional intelligence standards.`,
});

export async function performDeepOSINTSearch(input: DeepOSINTSearchInput): Promise<DeepOSINTSearchOutput> {
  // Execute real-time modules via the intelligence service layer
  const [sherlock, harvester, phone, holehe, rica, discovery] = await Promise.all([
    performSherlockSearch(input.name),
    performHarvesterSearch(input.idNumber),
    performPhoneInfogaSearch(input.phoneNumber),
    performHoleheSearch(`intel-${input.idNumber.slice(-4)}@proton.me`),
    performRICAReview(input.phoneNumber, input.idNumber),
    getOSINTMatches(input.name, input.idNumber)
  ]);
  
  // Use AI to synthesize the raw telemetry into a structured intelligence dossier
  const {output} = await deepOSINTSearchPrompt({
    name: input.name,
    idNumber: input.idNumber,
    rawSherlock: JSON.stringify(sherlock),
    rawHarvester: JSON.stringify(harvester),
    rawPhone: JSON.stringify(phone),
    rawHolehe: JSON.stringify(holehe),
    rawRica: JSON.stringify(rica),
    rawDiscovery: JSON.stringify(discovery),
  });

  if (!output) {
    throw new Error('AI failed to synthesize deep OSINT telemetry.');
  }

  return {
    ...output,
    sherlockResults: sherlock,
    harvesterResults: harvester,
    phoneResults: phone,
    holeheResults: holehe,
    ricaResults: rica
  };
}
