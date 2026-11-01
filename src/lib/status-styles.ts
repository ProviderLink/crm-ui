import type { PillTone } from '@/components/shared/Pill';
import type { WorkEntryStatus } from '@/types/work-entry';

/** The small status dot shown beside a work status in selects. */
export const WORK_STATUS_DOT: Record<WorkEntryStatus, string> = {
  completed: 'bg-status-success',
  in_progress: 'bg-status-info',
  pending: 'bg-status-warning',
};

/** The pill colour of a work status. */
export const WORK_STATUS_TONE: Record<WorkEntryStatus, PillTone> = {
  completed: 'success',
  in_progress: 'info',
  pending: 'warning',
};
