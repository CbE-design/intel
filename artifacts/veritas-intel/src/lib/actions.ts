import { backgroundCheckSchema } from '@/app/schemas';
import type { Subject } from './types';

const API_BASE = '/api/intelligence';

interface FormState {
  report?: any;
  error?: string;
}

interface DeepSearchState {
  result?: any;
  error?: string;
}

interface ChatState {
  response?: any;
  error?: string;
}

/**
 * Generate an intelligence background check report via API server.
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

    const res = await fetch(`${API_BASE}/background-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectProfile: {
          name: subject.name,
          idNumber: subject.idNumber,
          address: subject.address,
          phoneNumber: subject.phoneNumber,
        },
        backgroundCheckParameters: {
          criminalRecordCheck: validatedFields.data.criminalRecordCheck,
          creditHistoryCheck: validatedFields.data.creditHistoryCheck,
          employmentVerification: validatedFields.data.employmentVerification,
        },
        southAfricanRegulations: validatedFields.data.southAfricanRegulations,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Intelligence Check Failed.' };
    }

    const result = await res.json();
    return { report: result };
  } catch (e: any) {
    console.error('Intelligence Cycle Failure:', e);
    return { error: e.message || 'Intelligence Check Failed.' };
  }
}

/**
 * Perform a Deep OSINT Discovery via API server.
 */
export async function performDeepSearchAction(
  subject: Subject,
  prevState: DeepSearchState
): Promise<DeepSearchState> {
  try {
    if (!subject) return { error: 'Subject profile missing' };

    const res = await fetch(`${API_BASE}/deep-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: subject.name,
        idNumber: subject.idNumber,
        phoneNumber: subject.phoneNumber,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Deep Discovery Failed.' };
    }

    const result = await res.json();
    return { result };
  } catch (e: any) {
    console.error('Deep Search Failure:', e);
    return { error: e.message || 'Deep Discovery Failed.' };
  }
}

/**
 * Intelligence Chat — subject interrogation via API server.
 */
export async function interrogateSubjectAction(
  subject: Subject,
  message: string,
  context?: string
): Promise<ChatState> {
  try {
    if (!subject) return { error: 'Subject identity lost.' };

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectProfile: {
          name: subject.name,
          idNumber: subject.idNumber,
          phoneNumber: subject.phoneNumber,
          address: subject.address,
        },
        message,
        dossierContext: context,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Analysis unavailable.' };
    }

    const result = await res.json();
    return { response: result };
  } catch (e: any) {
    console.error('Interrogation Failure:', e);
    return { error: e.message || 'Analysis unavailable.' };
  }
}

/**
 * Global Criminological Research via API server.
 */
export async function performGlobalResearchAction(
  message: string
): Promise<ChatState> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Research unavailable.' };
    }

    const result = await res.json();
    return { response: result };
  } catch (e: any) {
    console.error('Research Failure:', e);
    return { error: e.message || 'Research unavailable.' };
  }
}
