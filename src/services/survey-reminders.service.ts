import api from '@/lib/api';
import { LIST_LIMIT, toQueryString } from '@/lib/api-query';
import type {
  ISurveyReminder,
  UpdateSurveyReminderPayload,
} from '@/types/survey-reminder';

export async function getSurveyReminders(): Promise<ISurveyReminder[]> {
  // A large page: without a limit the backend silently returns 20 rows.
  const { data } = await api.get<{ data: ISurveyReminder[] }>(
    `/crm/survey-reminders?${toQueryString({ limit: LIST_LIMIT })}`
  );
  return data.data;
}

export async function updateSurveyReminder(
  id: string,
  payload: UpdateSurveyReminderPayload
): Promise<ISurveyReminder> {
  const { data } = await api.patch<{ data: ISurveyReminder }>(
    `/crm/survey-reminders/${id}`,
    payload
  );
  return data.data;
}
