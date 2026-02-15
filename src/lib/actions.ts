'use server';

import { generateBackgroundCheckReport, type GenerateBackgroundCheckReportInput } from '@/ai/flows/generate-background-check-report';
import { performDeepOSINTSearch, type DeepOSINTSearchInput, type DeepOSINTSearchOutput } from '@/ai/flows/perform-deep-osint-search';
import { backgroundCheckSchema } from '@/app/schemas';
import type { Report, Subject } from './types';
import { revalidatePath } from 'next/cache';

interface FormState {
  report?: Report;
  error?: string;
}

interface DeepSearchState {
  result?: DeepOSINTSearchOutput;
  error?: string;
}

/**
 * Server action to generate an intelligence report.
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
    revalidatePath(`/subjects/${subject.id}`);
    
    return { report: result };

  } catch (e: any) {
    console.error('Intelligence Cycle Failure:', e);
    return { error: `Intelligence Check Failed: ${e.message || 'Unknown error'}` };
  }
}

/**
 * Server action to perform a Deep OSINT Discovery.
 */
export async function performDeepSearchAction(
  subject: Subject,
  prevState: DeepSearchState
): Promise<DeepSearchState> {
  try {
    if (!subject) return { error: 'Subject profile missing' };
    
    const input: DeepOSINTSearchInput = {
      name: subject.name,
      idNumber: subject.idNumber
    };
    
    const result = await performDeepOSINTSearch(input);
    revalidatePath(`/subjects/${subject.id}`);
    
    return { result };
  } catch (e: any) {
    console.error('Deep Search Failure:', e);
    return { error: `Deep Discovery Failed: ${e.message}` };
  }
}
