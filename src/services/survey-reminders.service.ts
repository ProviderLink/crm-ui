import api from '@/lib/api';
import type {
  ISurveyReminder,
  UpdateSurveyReminderPayload,
} from '@/types/survey-reminder';

export async function getSurveyReminders(): Promise<ISurveyReminder[]> {
  // Backend defaults to limit=20 when omitted, which silently truncates the list;
  // fetch a large page so every row is returned.
  const { data } = await api.get<{ data: ISurveyReminder[] }>(
    '/crm/survey-reminders?limit=1000'
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
