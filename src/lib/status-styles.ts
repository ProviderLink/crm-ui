import type { SurveyStatus } from '@/types/survey-reminder';
import type { WorkEntryStatus } from '@/types/work-entry';

/**
 * Pill styles per status. Colour is carried by the text and a faint border
 * only (the design system uses status colours for small marks, never fills),
 * so a glance at a table tells the states apart.
 */
const PILL = 'bg-white/[0.04]';

export const WORK_ENTRY_STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed: `${PILL} text-status-success border-status-success/20`,
  in_progress: `${PILL} text-status-info border-status-info/20`,
  pending: `${PILL} text-status-warning border-status-warning/20`,
};

export const SURVEY_STATUS_STYLES: Record<SurveyStatus, string> = {
  pending: `${PILL} text-status-warning border-status-warning/20`,
  sent: `${PILL} text-status-info border-status-info/20`,
  completed: `${PILL} text-status-success border-status-success/20`,
  skipped: `${PILL} text-text-tertiary border-white/[0.08]`,
};
