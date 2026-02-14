'use server';

/**
 * @fileOverview Generates a comprehensive, verified background check report.
 *
 * - generateBackgroundCheckReport - A function that generates the background check report.
 * - GenerateBackgroundCheckReportInput - The input type for the generateBackgroundCheckReport function.
 * - GenerateBackgroundCheckReportOutput - The return type for the generateBackgroundCheckReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBackgroundCheckReportInputSchema = z.object({
  subjectProfile: z.object({
    name: z.string().describe('The name of the subject.'),
    idNumber: z.string().describe('The ID number of the subject.'),
    address: z.string().describe('The address of the subject.'),
    phoneNumber: z.string().describe('The phone number of the subject.'),
  }).describe('The profile information of the subject.'),
  backgroundCheckParameters: z.object({
    criminalRecordCheck: z.boolean().describe('Whether to include criminal record check.'),
    creditHistoryCheck: z.boolean().describe('Whether to include credit history check.'),
    employmentVerification: z.boolean().describe('Whether to include employment verification.'),
  }).describe('The parameters for the background check.'),
  southAfricanRegulations: z.string().describe('Relevant South African regulations to consider.'),
}).describe('Input for generating a background check report.');

export type GenerateBackgroundCheckReportInput = z.infer<typeof GenerateBackgroundCheckReportInputSchema>;

const GenerateBackgroundCheckReportOutputSchema = z.object({
  report: z.string().describe('The generated background check report.'),
  riskAssessment: z.string().describe('A risk assessment based on the background check data.'),
  verificationScore: z.number().min(0).max(100).describe('A numerical score representing the overall verification confidence.'),
}).describe('Output of the background check report generation.');

export type GenerateBackgroundCheckReportOutput = z.infer<typeof GenerateBackgroundCheckReportOutputSchema>;

/**
 * Tool: Simulates a check against the SAPS (South African Police Service) database.
 */
const checkCriminalRecord = ai.defineTool({
  name: 'checkCriminalRecord',
  description: 'Checks the SAPS national database for criminal records matching an ID number.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    hasRecord: z.boolean(),
    details: z.string().optional(),
    status: z.string(),
  }),
}, async (input) => {
  // Logic: In a real app, this calls an external Gov API. 
  // For now, we simulate a "Clear" result for demo purposes unless ID starts with '8' (arbitrary flag).
  const isFlagged = input.idNumber.startsWith('8');
  return {
    hasRecord: isFlagged,
    details: isFlagged ? 'Minor traffic violation recorded in 2019.' : 'No records found.',
    status: 'Verified via SAPS Digital Interface',
  };
});

/**
 * Tool: Simulates a credit bureau check (TransUnion/Experian).
 */
const checkCreditHistory = ai.defineTool({
  name: 'checkCreditHistory',
  description: 'Retrieves credit rating and financial risk flags from certified bureaus.',
  inputSchema: z.object({ idNumber: z.string() }),
  outputSchema: z.object({
    creditScore: z.number(),
    riskFlag: z.enum(['Low', 'Medium', 'High']),
    recentDefaults: z.boolean(),
  }),
}, async (input) => {
  // Simulating external bureau data
  return {
    creditScore: 680,
    riskFlag: 'Low',
    recentDefaults: false,
  };
});

/**
 * Tool: Simulates employment history verification.
 */
const checkEmploymentHistory = ai.defineTool({
  name: 'checkEmploymentHistory',
  description: 'Verifies past employment records and duration.',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({
    lastVerifiedEmployer: z.string(),
    duration: z.string(),
    verified: z.boolean(),
  }),
}, async (input) => {
  return {
    lastVerifiedEmployer: 'Dynamic Tech Solutions (Pty) Ltd',
    duration: '2020 - 2024',
    verified: true,
  };
});

const generateBackgroundCheckReportPrompt = ai.definePrompt({
  name: 'generateBackgroundCheckReportPrompt',
  input: {schema: GenerateBackgroundCheckReportInputSchema},
  output: {schema: GenerateBackgroundCheckReportOutputSchema},
  tools: [checkCriminalRecord, checkCreditHistory, checkEmploymentHistory],
  prompt: `You are an expert Intelligence Analyst specializing in South African security protocols.

  Your mission is to generate a VERIFIED Intelligence Report for the following subject. 
  
  CRITICAL COMPLIANCE: 
  - Ensure all findings adhere to the POPI Act (Protection of Personal Information).
  - Credit data must be handled per the National Credit Act (NCA).
  - If a tool returns a negative result, clearly mark the risk.

  Subject:
  Name: {{{subjectProfile.name}}}
  ID: {{{subjectProfile.idNumber}}}
  Address: {{{subjectProfile.address}}}

  Operational Parameters:
  - Criminal Check Required: {{{backgroundCheckParameters.criminalRecordCheck}}}
  - Credit Check Required: {{{backgroundCheckParameters.creditHistoryCheck}}}
  - Employment Check Required: {{{backgroundCheckParameters.employmentVerification}}}

  Regulatory Context: {{{southAfricanRegulations}}}

  INSTRUCTIONS:
  1. Use the provided tools (checkCriminalRecord, checkCreditHistory, checkEmploymentHistory) ONLY IF the corresponding parameter is true.
  2. Synthesize the tool outputs into a professional, high-fidelity report.
  3. Assign a Verification Score (0-100) based on how many checks passed without flags.
  4. Provide a distinct "Risk Assessment" that categorizes the subject as "Clear", "Review Required", or "Critical Risk".`,  
});

export async function generateBackgroundCheckReport(input: GenerateBackgroundCheckReportInput): Promise<GenerateBackgroundCheckReportOutput> {
  const {output} = await generateBackgroundCheckReportPrompt(input);
  return output!;
}
