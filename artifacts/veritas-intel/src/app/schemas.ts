import { z } from 'zod';

export const backgroundCheckSchema = z.object({
  criminalRecordCheck: z.boolean().default(false),
  creditHistoryCheck: z.boolean().default(false),
  employmentVerification: z.boolean().default(false),
  southAfricanRegulations: z.string().min(10, 'Please provide relevant regulations.'),
});

export type BackgroundCheckSchema = z.infer<typeof backgroundCheckSchema>;
