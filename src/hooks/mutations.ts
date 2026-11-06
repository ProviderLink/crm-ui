import { QK } from '@/hooks/queries';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { generateScorecards } from '@/services/scorecards.service';
import { updateSurveyReminder } from '@/services/survey-reminders.service';
import { todayString } from '@/lib/time';
import type { SurveyStatus } from '@/types/survey-reminder';

/** Builds this week's scorecards for every VA the caller may see. */
export function useGenerateScorecards() {
  return useApiMutation({
    mutationFn: () => generateScorecards(),
    invalidate: [QK.scorecardsAll],
    errorMessage: 'Failed to generate scorecards. Please try again.',
  });
}

/** Marks a survey reminder completed or skipped. */
export function useUpdateSurveyReminder(errorMessage: string) {
  return useApiMutation({
    mutationFn: ({ id, status }: { id: string; status: SurveyStatus }) =>
      updateSurveyReminder(id, {
        status,
        ...(status === 'completed' ? { completedDate: todayString() } : {}),
      }),
    invalidate: [QK.surveyReminders],
    errorMessage,
  });
}
