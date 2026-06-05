'use server';

import { generateBackgroundCheckReport, type GenerateBackgroundCheckReportInput } from '@/ai/flows/generate-background-check-report';
import { performDeepOSINTSearch, type DeepOSINTSearchInput, type DeepOSINTSearchOutput } from '@/ai/flows/perform-deep-osint-search';
import { chatWithIntelligence, type IntelligenceChatInput, type IntelligenceChatOutput } from '@/ai/flows/intelligence-chat';
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

interface ChatState {
  response?: IntelligenceChatOutput;
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
    return { error: e.message || 'Intelligence Check Failed.' };
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
      idNumber: subject.idNumber,
      phoneNumber: subject.phoneNumber
    };
    
    const result = await performDeepOSINTSearch(input);
    revalidatePath(`/subjects/${subject.id}`);
    
    return { result };
  } catch (e: any) {
    console.error('Deep Search Failure:', e);
    return { error: e.message || 'Deep Discovery Failed.' };
  }
}

/**
 * Server action for the Intelligence Chat (Subject Interrogation).
 */
export async function interrogateSubjectAction(
  subject: Subject,
  message: string,
  context?: string
): Promise<ChatState> {
  try {
    if (!subject) return { error: 'Subject identity lost.' };
    
    const input: IntelligenceChatInput = {
      subjectProfile: {
        name: subject.name,
        idNumber: subject.idNumber,
        phoneNumber: subject.phoneNumber,
        address: subject.address,
      },
      message,
      dossierContext: context,
    };
    
    const result = await chatWithIntelligence(input);
    return { response: result };
  } catch (e: any) {
    console.error('Interrogation Failure:', e);
    return { error: e.message || 'Handshake Denied.' };
  }
}

/**
 * Server action for Global Criminological Research (Unrestricted).
 */
export async function performGlobalResearchAction(
  message: string
): Promise<ChatState> {
  try {
    const input: IntelligenceChatInput = {
      message,
    };
    
    const result = await chatWithIntelligence(input);
    return { response: result };
  } catch (e: any) {
    console.error('Research Failure:', e);
    return { error: e.message || 'Research Handshake Denied.' };
  }
}
