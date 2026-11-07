import api from '@/lib/api';
import { getAllPages } from '@/lib/get-all-pages';
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
  // A large page, so VA/client names are joined for the whole range.
  return getAllPages<IEodSubmission>('/crm/eod-submissions', { ...query });
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
