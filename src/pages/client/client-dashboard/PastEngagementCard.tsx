import { AssignmentStatusPill, InitialsTile } from '@/components/shared/badges';

import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

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
        <InitialsTile name={displayName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {a.serviceType ?? 'VA Service'} · {formatDateKeyLong(a.startDate)}
            {a.endDate ? ` – ${formatDateKeyLong(a.endDate)}` : ''}
          </p>
        </div>
      </div>
      <AssignmentStatusPill status={a.status} />
    </li>
  );
}
