import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { AssignmentStatus } from '../../admin/assignments/AssignmentStatus';
import { initials } from './helpers';

/** One finished engagement, as a quiet row in the past-engagements list. */
export function PastEngagementCard({
  assignment: a,
  displayName,
}: {
  assignment: IAssignment;
  displayName: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
          {initials(displayName) || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {a.serviceType ?? 'VA Service'} · {formatDateKeyLong(a.startDate)}
            {a.endDate ? ` – ${formatDateKeyLong(a.endDate)}` : ''}
          </p>
        </div>
      </div>
      <AssignmentStatus status={a.status} />
    </li>
  );
}
