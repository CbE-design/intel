'use server';

/**
 * @fileOverview Intelligence Report Generation Flow
 * 
 * Synthesizes data from internal and external sources into a structured report.
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
  description: 'Checks SAPS national database via integrated mock service.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    hasRecord: z.boolean(),
    details: z.string(),
    status: z.string(),
  }),
}, async (input) => {
  // Simulator: ID starting with 8 indicates a flagged record
  const isFlagged = input.idNumber.startsWith('8');
  return {
    hasRecord: isFlagged,
    details: isFlagged ? 'Minor infraction: Traffic violation (2019)' : 'No criminal records identified.',
    status: 'Verified via SAPS Digital Certificate (Mock)',
  };
});

const checkCreditHistory = ai.defineTool({
  name: 'checkCreditHistory',
  description: 'Retrieves simulated financial risk from TransUnion/Experian.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    creditScore: z.number(),
    riskFlag: z.enum(['Low', 'Medium', 'High']),
    recentDefaults: z.boolean(),
  }),
}, async () => {
  return {
    creditScore: 680 + Math.floor(Math.random() * 100),
    riskFlag: 'Low',
    recentDefaults: false,
  };
});

const checkEmploymentHistory = ai.defineTool({
  name: 'checkEmploymentHistory',
  description: 'Verifies past employment records.',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({
    lastVerifiedEmployer: z.string(),
    duration: z.string(),
    verified: z.boolean(),
  }),
}, async () => {
  return {
    lastVerifiedEmployer: 'Strategic Security Solutions (Pty) Ltd',
    duration: '2020 - 2024',
    verified: true,
  };
});

const generateBackgroundCheckReportPrompt = ai.definePrompt({
  name: 'generateBackgroundCheckReportPrompt',
  input: {schema: GenerateBackgroundCheckReportInputSchema},
  output: {schema: GenerateBackgroundCheckReportOutputSchema},
  tools: [checkCriminalRecord, checkCreditHistory, checkEmploymentHistory],
  prompt: `You are a Professional Intelligence Analyst.
  
  Generate a verified Intelligence Report for:
  Subject: {{{subjectProfile.name}}}
  ID: {{{subjectProfile.idNumber}}}
  
  Operational Context: {{{southAfricanRegulations}}}
  
  Use the tools provided ONLY for the parameters requested. 
  
  SYNTHESIS REQUIREMENTS:
  1. Produce a detailed narrative report.
  2. Provide a 0-100 Verification Score.
  3. Final Risk Assessment must be one of: CLEAR, REVIEW REQUIRED, or CRITICAL.`,
});

export async function generateBackgroundCheckReport(input: GenerateBackgroundCheckReportInput): Promise<GenerateBackgroundCheckReportOutput> {
  const {output} = await generateBackgroundCheckReportPrompt(input);
  return output!;
}
