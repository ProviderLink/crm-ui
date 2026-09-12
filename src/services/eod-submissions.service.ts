import api from '@/lib/api';
import type {
  CreateEodPayload,
  EodContext,
  IEodSubmission,
} from '@/types/eod-submission';

interface EodQuery {
  assignmentId?: string;
  candidateId?: string;
  clientId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getEodSubmissions(
  query: EodQuery = {}
): Promise<IEodSubmission[]> {
  const params = new URLSearchParams();
  if (query.assignmentId) params.set('assignmentId', query.assignmentId);
  if (query.candidateId) params.set('candidateId', query.candidateId);
  if (query.clientId) params.set('clientId', query.clientId);
  if (query.date) params.set('date', query.date);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  // Backend defaults to limit=20; fetch a large page so EOD rows are returned
  // and VA/client names can be joined backend-side for the full range.
  params.set('limit', '1000');
  const { data } = await api.get<{ data: IEodSubmission[] }>(
    `/crm/eod-submissions?${params.toString()}`
  );
  return data.data;
}

/**
 * The company's current business day.
 *
 * VAs work from every timezone, so the submit form must not trust the device
 * clock: the backend owns "today", defined by the company timezone.
 */
export async function getEodContext(): Promise<EodContext> {
  const { data } = await api.get<{ data: EodContext }>(
    '/crm/eod-submissions/context'
  );
  return data.data;
}

export async function createEodSubmission(
  payload: CreateEodPayload
): Promise<IEodSubmission> {
  const { data } = await api.post<{ data: IEodSubmission }>(
    '/crm/eod-submissions',
    payload
  );
  return data.data;
}

export async function deleteEodSubmission(id: string): Promise<void> {
  await api.delete(`/crm/eod-submissions/${id}`);
}

export async function getEodSubmission(id: string): Promise<IEodSubmission> {
  const { data } = await api.get<{ data: IEodSubmission }>(
    `/crm/eod-submissions/${id}`
  );
  return data.data;
}
