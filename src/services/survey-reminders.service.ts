import api from '@/lib/api'
import type {
  ISurveyReminder,
  UpdateSurveyReminderPayload,
} from '@/types/survey-reminder'

export async function getSurveyReminders(): Promise<ISurveyReminder[]> {
  const { data } = await api.get<{ data: ISurveyReminder[] }>(
    '/survey-reminders'
  )
  return data.data
}

export async function updateSurveyReminder(
  id: string,
  payload: UpdateSurveyReminderPayload
): Promise<ISurveyReminder> {
  const { data } = await api.patch<{ data: ISurveyReminder }>(
    `/survey-reminders/${id}`,
    payload
  )
  return data.data
}
