import api from '@/lib/api';

export interface IAtsJob {
  id: string;
  _id: string;
  title: string;
  clientId: string;
  status: 'open' | 'closed' | 'draft' | 'on_hold';
}

/** Fetch all jobs (read-only from ATS). */
export async function getAtsJobs(): Promise<IAtsJob[]> {
  const { data } = await api.get<{ data: any[] }>('/ats/jobs');
  return data.data.map((j: any) => ({ ...j, id: j._id ?? j.id }));
}
