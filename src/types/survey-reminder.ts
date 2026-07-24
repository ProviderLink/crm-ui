export type SurveyRelatedType = 'client' | 'va' | 'assignment';
export type SurveyType = '3_day' | '1_week' | '30_day' | 'monthly';
export type SurveyStatus = 'pending' | 'sent' | 'completed' | 'skipped';

export interface ISurveyReminder {
  _id: string;
  relatedType: SurveyRelatedType;
  relatedId: string;
  surveyType: SurveyType;
  dueDate: string;
  completedDate?: string;
  status: SurveyStatus;
  assignedTo?: string;
  createdAt: string;
}

export interface UpdateSurveyReminderPayload {
  status: SurveyStatus;
  completedDate?: string;
}
