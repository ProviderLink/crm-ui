import type { AssignmentRow } from './use-am-assignments';
import { Pill } from '@/components/shared/Pill';

const dash = <span className="text-xs text-muted-foreground/50">—</span>;

/** Whether today's report is in; on hold, not started or a weekend owes none. */
export function TodayPill({ row }: { row: AssignmentRow }) {
  const { status } = row.assignment;
  if (status === 'on_hold') return <Pill>On hold</Pill>;
  if (status === 'ended') return dash;
  if (row.submittedToday) return <Pill tone="success">Submitted</Pill>;
  if (!row.reportDue) return <Pill tone="muted">Not due</Pill>;
  return <Pill tone="warning">Missing</Pill>;
}
