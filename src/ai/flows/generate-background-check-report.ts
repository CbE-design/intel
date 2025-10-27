'use server';

/**
 * @fileOverview Generates a comprehensive background check report.
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
}).describe('Output of the background check report generation.');

export type GenerateBackgroundCheckReportOutput = z.infer<typeof GenerateBackgroundCheckReportOutputSchema>;

export async function generateBackgroundCheckReport(input: GenerateBackgroundCheckReportInput): Promise<GenerateBackgroundCheckReportOutput> {
  return generateBackgroundCheckReportFlow(input);
}

const shouldIncorporateInformation = ai.defineTool({
  name: 'shouldIncorporateInformation',
  description: 'Determines whether specific information should be included in the background check report based on the parameters and South African regulations.',
  inputSchema: z.object({
    informationType: z.string().describe('The type of information to consider (e.g., criminal record, credit history).'),
    backgroundCheckParameters: z.object({
      criminalRecordCheck: z.boolean().describe('Whether to include criminal record check.'),
      creditHistoryCheck: z.boolean().describe('Whether to include credit history check.'),
      employmentVerification: z.boolean().describe('Whether to include employment verification.'),
    }).describe('The parameters for the background check.'),
    southAfricanRegulations: z.string().describe('Relevant South African regulations to consider.'),
  }),
  outputSchema: z.boolean().describe('Whether the information should be incorporated into the report.'),
}, async (input) => {
  // Placeholder implementation:  Always include the information.
  // In a real implementation, this would evaluate the backgroundCheckParameters
  // and southAfricanRegulations to determine if the informationType should be included.
  return true;
});

const generateBackgroundCheckReportPrompt = ai.definePrompt({
  name: 'generateBackgroundCheckReportPrompt',
  input: {schema: GenerateBackgroundCheckReportInputSchema},
  output: {schema: GenerateBackgroundCheckReportOutputSchema},
  tools: [shouldIncorporateInformation],
  prompt: `You are an expert in generating background check reports, specifically tailored for South African regulations.

  Generate a comprehensive background check report for the subject based on the provided information and background check parameters.  Include a risk assessment based on the analyzed data.

  Subject Profile:
  Name: {{{subjectProfile.name}}}
  ID Number: {{{subjectProfile.idNumber}}}
  Address: {{{subjectProfile.address}}}
  Phone Number: {{{subjectProfile.phoneNumber}}}

  Background Check Parameters:
  Criminal Record Check: {{{backgroundCheckParameters.criminalRecordCheck}}}
  Credit History Check: {{{backgroundCheckParameters.creditHistoryCheck}}}
  Employment Verification: {{{backgroundCheckParameters.employmentVerification}}}

  South African Regulations: {{{southAfricanRegulations}}}

  Report:
  The report should include relevant information based on the background check parameters and South African regulations. Use the "shouldIncorporateInformation" tool to determine if specific information types (e.g., criminal record, credit history) should be included.

  Risk Assessment:
  Provide a risk assessment based on the background check data.`,  
});

const generateBackgroundCheckReportFlow = ai.defineFlow(
  {
    name: 'generateBackgroundCheckReportFlow',
    inputSchema: GenerateBackgroundCheckReportInputSchema,
    outputSchema: GenerateBackgroundCheckReportOutputSchema,
  },
  async input => {
    const {output} = await generateBackgroundCheckReportPrompt(input);
    return output!;
  }
);
