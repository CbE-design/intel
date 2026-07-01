const BASE = '/api';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  subjects: {
    list: () => req<any[]>('/subjects'),
    get: (id: string) => req<any>(`/subjects/${id}`),
    create: (data: object) => req<any>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/subjects/${id}`, { method: 'DELETE' }),
  },
  locations: {
    list: (subjectId: string) => req<any[]>(`/subjects/${subjectId}/locations`),
    create: (subjectId: string, data: object) =>
      req<any>(`/subjects/${subjectId}/locations`, { method: 'POST', body: JSON.stringify(data) }),
  },
  backgroundChecks: {
    list: (subjectId: string) => req<any[]>(`/subjects/${subjectId}/background-checks`),
    create: (subjectId: string, data: object) =>
      req<any>(`/subjects/${subjectId}/background-checks`, { method: 'POST', body: JSON.stringify(data) }),
  },
  auditLog: {
    list: (subjectId: string) => req<any[]>(`/subjects/${subjectId}/audit-log`),
    create: (subjectId: string, data: object) =>
      req<any>(`/subjects/${subjectId}/audit-log`, { method: 'POST', body: JSON.stringify(data) }),
  },
  caseNotes: {
    list: (subjectId: string) => req<any[]>(`/subjects/${subjectId}/case-notes`),
    create: (subjectId: string, data: object) =>
      req<any>(`/subjects/${subjectId}/case-notes`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (subjectId: string, noteId: string) =>
      req<void>(`/subjects/${subjectId}/case-notes/${noteId}`, { method: 'DELETE' }),
  },
  researchReports: {
    list: () => req<any[]>('/research-reports'),
    create: (data: object) =>
      req<any>('/research-reports', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/research-reports/${id}`, { method: 'DELETE' }),
  },
};
