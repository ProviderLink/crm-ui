import type { ISurveyReminder } from '@/types/survey-reminder';

/** Still to be done: not completed or skipped yet. */
export const isOpen = (r: ISurveyReminder): boolean =>
  r.status === 'pending' || r.status === 'sent';

/** The due date as a `YYYY-MM-DD` key ('' when missing). */
export const dueKey = (r: ISurveyReminder): string =>
  r.dueDate?.slice(0, 10) ?? '';
