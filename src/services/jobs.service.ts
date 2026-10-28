import api from '@/lib/api';
import { withId, type ApiDoc } from '@/lib/with-id';

export interface IAtsJob {
  id: string;
  _id: string;
  title: string;
  clientId: string;
  status: 'open' | 'closed' | 'draft' | 'on_hold';
}

/** Fetch all jobs (read-only from ATS). */
export async function getAtsJobs(): Promise<IAtsJob[]> {
  const { data } = await api.get<{ data: ApiDoc<IAtsJob>[] }>('/ats/jobs');
  return data.data.map(j => withId<IAtsJob>(j));
}
