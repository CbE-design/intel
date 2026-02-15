'use server';

/**
 * @fileOverview Official Intelligence Dossier Generation Flow
 * 
 * Synthesizes cross-referenced data into a formal dossier.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBackgroundCheckReportInputSchema = z.object({
  subjectProfile: z.object({
    name: z.string(),
    idNumber: z.string(),
    address: z.string(),
    phoneNumber: z.string(),
  }),
  backgroundCheckParameters: z.object({
    criminalRecordCheck: z.boolean(),
    creditHistoryCheck: z.boolean(),
    employmentVerification: z.boolean(),
  }),
  southAfricanRegulations: z.string(),
});

export type GenerateBackgroundCheckReportInput = z.infer<typeof GenerateBackgroundCheckReportInputSchema>;

const GenerateBackgroundCheckReportOutputSchema = z.object({
  report: z.string(),
  riskAssessment: z.string(),
  verificationScore: z.number().min(0).max(100),
});

export type GenerateBackgroundCheckReportOutput = z.infer<typeof GenerateBackgroundCheckReportOutputSchema>;

const checkCriminalRecord = ai.defineTool({
  name: 'checkCriminalRecord',
  description: 'Searches SAPS National Database via MIE gateway.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    hasRecord: z.boolean(),
    details: z.string(),
    verifiedDate: z.string(),
    issuingAuthority: z.string(),
  }),
}, async (input) => {
  const isFlagged = input.idNumber.startsWith('8');
  return {
    hasRecord: isFlagged,
    details: isFlagged ? 'Case #2019/543: Section 12(1) of National Road Traffic Act. Fine Paid.' : 'No criminal convictions or active warrants identified.',
    verifiedDate: new Date().toISOString(),
    issuingAuthority: 'SAPS Criminal Record Centre (Mock)',
  };
});

const checkCreditHistory = ai.defineTool({
  name: 'checkCreditHistory',
  description: 'Retrieves financial integrity snapshot from TransUnion South Africa.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    creditScore: z.number(),
    riskCategory: z.string(),
    judgments: z.array(z.string()),
    verified: z.boolean(),
  }),
}, async () => {
  return {
    creditScore: 710 + Math.floor(Math.random() * 80),
    riskCategory: 'Low',
    judgments: [],
    verified: true,
  };
});

const generateBackgroundCheckReportPrompt = ai.definePrompt({
  name: 'generateBackgroundCheckReportPrompt',
  input: {schema: GenerateBackgroundCheckReportInputSchema},
  output: {schema: GenerateBackgroundCheckReportOutputSchema},
  tools: [checkCriminalRecord, checkCreditHistory],
  prompt: `You are a Senior Intelligence Analyst at Veritas Intel.
  
  TASK: Generate a formal Intelligence Dossier for the subject: {{{subjectProfile.name}}}.
  
  PARAMETERS:
  Criminal Search: {{#if backgroundCheckParameters.criminalRecordCheck}}ENABLED{{else}}DISABLED{{/if}}
  Credit Search: {{#if backgroundCheckParameters.creditHistoryCheck}}ENABLED{{else}}DISABLED{{/if}}
  
  GUIDELINES:
  1. Use the provided tools to gather data.
  2. Structure the report with professional headings (e.g., EXECUTIVE SUMMARY, FINDINGS, RISK MITIGATION).
  3. Adhere to South African legal context: {{{southAfricanRegulations}}}.
  4. The "report" field should be a long-form professional text.
  5. The "riskAssessment" field should be a concise summary of the risk level (CLEAR, CAUTION, or CRITICAL).
  6. Provide a "verificationScore" between 0-100 reflecting the confidence in the findings.`,
});

export async function generateBackgroundCheckReport(input: GenerateBackgroundCheckReportInput): Promise<GenerateBackgroundCheckReportOutput> {
  const {output} = await generateBackgroundCheckReportPrompt(input);
  return output!;
}
