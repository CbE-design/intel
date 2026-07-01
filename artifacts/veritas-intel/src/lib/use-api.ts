import { useState, useEffect, useCallback } from 'react';
import { api } from './api-client';
import type { Subject, Location, Report, AuditEntry, CaseNote, ResearchReport } from './types';

export function useSubjects() {
  const [data, setData] = useState<Subject[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const subjects = await api.subjects.list();
      setData(subjects);
    } catch (e) {
      console.error('useSubjects', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, isLoading, refresh };
}

export function useSubject(id: string) {
  const [data, setData] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.subjects.get(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { data, isLoading };
}

export function useLocations(subjectId: string) {
  const [data, setData] = useState<Location[] | null>(null);

  const refresh = useCallback(async () => {
    try { setData(await api.locations.list(subjectId)); }
    catch (e) { console.error('useLocations', e); }
  }, [subjectId]);

  useEffect(() => { if (subjectId) refresh(); }, [subjectId, refresh]);
  return { data, refresh };
}

export function useBackgroundChecks(subjectId: string) {
  const [data, setData] = useState<Report[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setData(await api.backgroundChecks.list(subjectId));
    } catch (e) {
      console.error('useBackgroundChecks', e);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { if (subjectId) refresh(); }, [subjectId, refresh]);
  return { data, isLoading, refresh };
}

export function useAuditLog(subjectId: string) {
  const [data, setData] = useState<AuditEntry[] | null>(null);

  const refresh = useCallback(async () => {
    try { setData(await api.auditLog.list(subjectId)); }
    catch (e) { console.error('useAuditLog', e); }
  }, [subjectId]);

  useEffect(() => { if (subjectId) refresh(); }, [subjectId, refresh]);
  return { data, refresh };
}

export function useCaseNotes(subjectId: string) {
  const [data, setData] = useState<CaseNote[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setData(await api.caseNotes.list(subjectId));
    } catch (e) {
      console.error('useCaseNotes', e);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { if (subjectId) refresh(); }, [subjectId, refresh]);
  return { data, isLoading, refresh };
}

export function useResearchReports() {
  const [data, setData] = useState<ResearchReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setData(await api.researchReports.list());
    } catch (e) {
      console.error('useResearchReports', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, isLoading, refresh };
}
