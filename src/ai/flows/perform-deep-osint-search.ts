'use server';

/**
 * @fileOverview Active Deep OSINT Discovery Agent
 * 
 * Orchestrates real-time telemetry from active modules.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  getOSINTMatches, 
  performSherlockSearch, 
  performHarvesterSearch,
  performPhoneInfogaSearch,
  performHoleheSearch,
  performRICAReview,
  performBreachLookup,
  performNetworkRecon,
  getDeedsOfficeRecords,
  getVehicleRegistryRecords
} from '@/lib/intelligence-service';

const DeepOSINTSearchInputSchema = z.object({
  name: z.string(),
  idNumber: z.string(),
  phoneNumber: z.string(),
});

export type DeepOSINTSearchInput = z.infer<typeof DeepOSINTSearchInputSchema>;

const DeepOSINTSearchOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the real-time OSINT, RICA, and Breach findings.'),
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
  breachResults: z.array(z.object({
    name: z.string(),
    breachDate: z.string(),
    dataClasses: z.array(z.string())
  })),
  propertyResults: z.array(z.object({
    address: z.string(),
    estimatedValue: z.number(),
    purchaseDate: z.string(),
  })).optional(),
  vehicleResults: z.array(z.object({
    make: z.string(),
    model: z.string(),
    licensePlate: z.string(),
  })).optional(),
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
      rawBreaches: z.string(),
      rawNetwork: z.string(),
      rawProperties: z.string(),
      rawVehicles: z.string(),
    })
  },
  output: {schema: DeepOSINTSearchOutputSchema},
  prompt: `You are an Advanced Intelligence Discovery Agent at Veritas Intel.
  
  TASK: Synthesize real-time telemetry from active OSINT modules into a digital forensic dossier.
  
  SUBJECT: {{{name}}} (ID: {{{idNumber}}})
  
  TELEMETRY INPUTS:
  1. SHERLOCK (User Crawl): {{{rawSherlock}}}
  2. HARVESTER (Asset Recon): {{{rawHarvester}}}
  3. PHONEINFOGA (GSM Trace): {{{rawPhone}}}
  4. HOLEHE (Email Linkage): {{{rawHolehe}}}
  5. RICA (Identity Compliance): {{{rawRica}}}
  6. BREACH DIRECTORY: {{{rawBreaches}}}
  7. DEEDS OFFICE: {{{rawProperties}}}
  8. VEHICLE REGISTRY: {{{rawVehicles}}}
  
  INSTRUCTIONS:
  1. Correlate discovered breaches with digital footprints.
  2. Verify RICA alignment.
  3. Evaluate asset concentration (Properties/Vehicles) against identity age.
  4. Provide a technically precise "summary" in a forensic tone.
  5. Calculate an "overallRiskScore" (0-100).
  
  Ensure your synthesis mirrors the highest professional intelligence standards.`,
});

export async function performDeepOSINTSearch(input: DeepOSINTSearchInput): Promise<DeepOSINTSearchOutput> {
  const [sherlock, harvester, phone, holehe, rica, breaches, properties, vehicles] = await Promise.all([
    performSherlockSearch(input.name),
    performHarvesterSearch(input.idNumber),
    performPhoneInfogaSearch(input.phoneNumber),
    performHoleheSearch(`intel-${input.idNumber.slice(-4)}@proton.me`),
    performRICAReview(input.phoneNumber, input.idNumber),
    performBreachLookup(input.idNumber),
    getDeedsOfficeRecords(input.idNumber),
    getVehicleRegistryRecords(input.idNumber)
  ]);
  
  const network = await performNetworkRecon(harvester.find(h => h.type === 'IP')?.value || '102.165.4.12');

  const {output} = await deepOSINTSearchPrompt({
    name: input.name,
    idNumber: input.idNumber,
    rawSherlock: JSON.stringify(sherlock),
    rawHarvester: JSON.stringify(harvester),
    rawPhone: JSON.stringify(phone),
    rawHolehe: JSON.stringify(holehe),
    rawRica: JSON.stringify(rica),
    rawBreaches: JSON.stringify(breaches),
    rawNetwork: JSON.stringify(network),
    rawProperties: JSON.stringify(properties),
    rawVehicles: JSON.stringify(vehicles),
  });

  if (!output) {
    throw new Error('AI failed to synthesize active OSINT telemetry.');
  }

  return {
    ...output,
    sherlockResults: sherlock,
    harvesterResults: harvester,
    phoneResults: phone,
    holeheResults: holehe,
    ricaResults: rica,
    breachResults: breaches,
    propertyResults: properties,
    vehicleResults: vehicles
  };
}
