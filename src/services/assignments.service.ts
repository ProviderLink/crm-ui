import api from '@/lib/api';
import type {
  CreateAssignmentPayload,
  IAssignment,
  UpdateAssignmentPayload,
} from '@/types/assignment';

// VA — own active assignments only
export async function getMyAssignments(): Promise<IAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>(
    '/crm/assignments?status=active'
  );
  return data.data;
}

// Admin/AM — all assignments with optional filters
export async function getAllAssignments(
  query: { status?: string; accountManagerId?: string } = {}
): Promise<IAssignment[]> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.accountManagerId)
    params.set('accountManagerId', query.accountManagerId);
  const { data } = await api.get<{ data: IAssignment[] }>(
    `/crm/assignments?${params.toString()}`
  );
  return data.data;
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<IAssignment> {
  const { data } = await api.post<{ data: IAssignment }>(
    '/crm/assignments',
    payload
  );
  return data.data;
}

export async function updateAssignment(
  id: string,
  payload: UpdateAssignmentPayload
): Promise<IAssignment> {
  const { data } = await api.patch<{ data: IAssignment }>(
    `/crm/assignments/${id}`,
    payload
  );
  return data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/crm/assignments/${id}`);
}
