'use server';

import { generateBackgroundCheckReport, type GenerateBackgroundCheckReportInput } from '@/ai/flows/generate-background-check-report';
import { backgroundCheckSchema } from '@/app/schemas';
import { getSubjectById } from './data';
import type { Report } from './types';
import { revalidatePath } from 'next/cache';

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
    // 1. Fetch subject data
    const subject = await getSubjectById(subjectId);
    if (!subject) {
      return { error: `Subject ID ${subjectId} not found in intelligence database.` };
    }

    // 2. Validate parameters
    const validatedFields = backgroundCheckSchema.safeParse({
      criminalRecordCheck: formData.get('criminalRecordCheck') === 'on',
      creditHistoryCheck: formData.get('creditHistoryCheck') === 'on',
      employmentVerification: formData.get('employmentVerification') === 'on',
      southAfricanRegulations: formData.get('southAfricanRegulations'),
    });

    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      return {
        error: fieldErrors.southAfricanRegulations?.[0] || 'Invalid search parameters provided.',
      };
    }
    
    // 3. Prepare AI Input
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

    // 4. Run AI Intelligence Cycle
    const result = await generateBackgroundCheckReport(input);

    // 5. Revalidate the subject page to show new history
    revalidatePath(`/subjects/${subjectId}`);
    
    return { report: result };

  } catch (e: any) {
    console.error('Intelligence Cycle Failure:', e);
    // Provide a more helpful error message based on the exception
    const message = e.message || 'An unknown error occurred during the intelligence cycle.';
    return { error: `Intelligence Check Failed: ${message}` };
  }
}
