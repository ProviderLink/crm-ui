export type SurveyRelatedType = 'client' | 'va' | 'assignment'
export type SurveyType = '3_day' | '1_week' | '30_day' | 'monthly'
export type SurveyStatus = 'pending' | 'sent' | 'completed' | 'skipped'

export interface ISurveyReminder {
  id: string
  related_type: SurveyRelatedType
  related_id: string
  survey_type: SurveyType
  due_date: string
  completed_date?: string
  status: SurveyStatus
  assigned_to?: string
  created_at: string
}

export interface UpdateSurveyReminderPayload {
  status: SurveyStatus
  completed_date?: string
}
