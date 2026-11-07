import api from '@/lib/api';
import { getAllPages } from '@/lib/get-all-pages';
import type {
  CreateWorkEntryPayload,
  IWorkEntry,
  UpdateWorkEntryPayload,
} from '@/types/work-entry';

interface WorkEntriesQuery {
  assignmentId?: string;
  candidateId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getWorkEntries(
  query: WorkEntriesQuery = {}
): Promise<IWorkEntry[]> {
  // A large page, so the VA/client name joins cover the whole range.
  return getAllPages<IWorkEntry>('/crm/work-entries', { ...query });
}

export async function createWorkEntry(
  payload: CreateWorkEntryPayload
): Promise<IWorkEntry> {
  const { data } = await api.post<{ data: IWorkEntry }>(
    '/crm/work-entries',
    payload
  );
  return data.data;
}

export async function updateWorkEntry(
  id: string,
  payload: UpdateWorkEntryPayload
): Promise<IWorkEntry> {
  const { data } = await api.patch<{ data: IWorkEntry }>(
    `/crm/work-entries/${id}`,
    payload
  );
  return data.data;
}
