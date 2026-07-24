import api from '@/lib/api';
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
  const params = new URLSearchParams();
  if (query.assignmentId) params.set('assignmentId', query.assignmentId);
  if (query.candidateId) params.set('candidateId', query.candidateId);
  if (query.clientId) params.set('clientId', query.clientId);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  // Backend defaults to limit=20 when omitted; fetch a large page so the
  // VA/Client name joins are populated for all rows in the requested range.
  params.set('limit', '1000');
  const { data } = await api.get<{ data: IWorkEntry[] }>(
    `/crm/work-entries?${params.toString()}`
  );
  return data.data;
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

export async function deleteWorkEntry(id: string): Promise<void> {
  await api.delete(`/crm/work-entries/${id}`);
}
