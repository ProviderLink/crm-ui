import api from '@/lib/api';
import { LIST_LIMIT, toQueryString } from '@/lib/api-query';
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

// VA — all assignments regardless of status (for dashboard overview)
export async function getMyAllAssignments(): Promise<IAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>('/crm/assignments');
  return data.data;
}

// Admin/AM — all assignments with optional filters
export async function getAllAssignments(
  query: {
    status?: string;
    accountManagerId?: string;
    clientId?: string;
  } = {}
): Promise<IAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>(
    `/crm/assignments?${toQueryString({ ...query, limit: LIST_LIMIT })}`
  );
  return data.data;
}

export async function getAssignment(id: string): Promise<IAssignment> {
  const { data } = await api.get<{ data: IAssignment }>(
    `/crm/assignments/${id}`
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
