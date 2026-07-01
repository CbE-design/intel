import { api } from './api-client';
import type { Subject, Location } from './types';

export async function getSubjects(): Promise<Subject[]> {
  return api.subjects.list();
}

export async function getSubjectById(id: string): Promise<Subject | undefined> {
  try {
    return await api.subjects.get(id);
  } catch {
    return undefined;
  }
}

export async function getSubjectLocations(subjectId: string): Promise<Location[]> {
  return api.locations.list(subjectId);
}
