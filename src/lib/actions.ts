'use server';

import { generateBackgroundCheckReport, type GenerateBackgroundCheckReportInput } from '@/ai/flows/generate-background-check-report';
import { backgroundCheckSchema } from '@/app/schemas';
import { getSubjectById } from './data';
import type { Report } from './types';

interface FormState {
  report?: Report;
  error?: string;
}

export async function generateReportAction(
  subjectId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const subject = getSubjectById(subjectId);
    if (!subject) {
      return { error: 'Subject not found.' };
    }

    const validatedFields = backgroundCheckSchema.safeParse({
      criminalRecordCheck: formData.get('criminalRecordCheck') === 'on',
      creditHistoryCheck: formData.get('creditHistoryCheck') === 'on',
      employmentVerification: formData.get('employmentVerification') === 'on',
      southAfricanRegulations: formData.get('southAfricanRegulations'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.southAfricanRegulations?.[0] || 'Invalid input.',
      };
    }
    
    const input: GenerateBackgroundCheckReportInput = {
        subjectProfile: {
            name: subject.name,
            idNumber: subject.idNumber,
            address: subject.address,
            phoneNumber: subject.phoneNumber
        },
        backgroundCheckParameters: {
            criminalRecordCheck: validatedFields.data.criminalRecordCheck,
            creditHistoryCheck: validatedFields.data.creditHistoryCheck,
            employmentVerification: validatedFields.data.employmentVerification
        },
        southAfricanRegulations: validatedFields.data.southAfricanRegulations
    };

    const result = await generateBackgroundCheckReport(input);
    
    return { report: result };

  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unknown error occurred.' };
  }
}
