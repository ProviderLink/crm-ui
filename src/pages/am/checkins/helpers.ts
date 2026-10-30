import type { ISurveyReminder } from '@/types/survey-reminder';

export const SURVEY_TYPE_LABELS: Record<ISurveyReminder['surveyType'], string> =
  {
    '3_day': '3-Day',
    '1_week': '1-Week',
    '30_day': '30-Day',
    monthly: 'Monthly',
  };

export const isOpen = (r: ISurveyReminder) =>
  r.status === 'pending' || r.status === 'sent';

export const dueKey = (r: ISurveyReminder) => r.dueDate?.slice(0, 10) ?? '';

// Whole days from `today` to `due` (both YYYY-MM-DD); negative when past.
export function daysUntil(due: string, today: string) {
  const [dy, dm, dd] = due.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return Math.round(
    (Date.UTC(dy!, dm! - 1, dd) - Date.UTC(ty!, tm! - 1, td)) / 86_400_000
  );
}

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
