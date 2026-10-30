import { Pill } from '../../admin/accounts/badges';
import type { AssignmentRow } from './use-am-assignments';

const dash = <span className="text-xs text-muted-foreground/50">—</span>;

/** Whether today's report is in; an assignment on hold owes none. */
export function TodayPill({ row }: { row: AssignmentRow }) {
  const { status } = row.assignment;
  if (status === 'on_hold') return <Pill>On hold</Pill>;
  if (status === 'ended') return dash;
  return row.submittedToday ? (
    <Pill tone="success">Submitted</Pill>
  ) : (
    <Pill tone="warning">Missing</Pill>
  );
}
