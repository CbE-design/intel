'use server';

import { generateBackgroundCheckReport, type GenerateBackgroundCheckReportInput } from '@/ai/flows/generate-background-check-report';
import { backgroundCheckSchema } from '@/app/schemas';
import type { Report, Subject } from './types';
import { revalidatePath } from 'next/cache';

interface FormState {
  report?: Report;
  error?: string;
}

/**
 * Server action to generate an intelligence report.
 * Accepts the full subject object to avoid unauthorized server-side Firestore reads.
 */
export async function generateReportAction(
  subject: Subject,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    if (!subject) {
      return { error: `Subject data is missing.` };
    }

    // 1. Validate parameters from the form
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
    
    // 2. Prepare AI Input using the data passed from the client
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

    // 3. Run AI Intelligence Cycle
    const result = await generateBackgroundCheckReport(input);

    // 4. Revalidate the path so the UI reflects the potential history update
    revalidatePath(`/subjects/${subject.id}`);
    
    return { report: result };

  } catch (e: any) {
    console.error('Intelligence Cycle Failure:', e);
    const message = e.message || 'An unknown error occurred during the intelligence cycle.';
    return { error: `Intelligence Check Failed: ${message}` };
  }
}
