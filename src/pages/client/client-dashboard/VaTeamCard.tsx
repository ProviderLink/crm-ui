import { MailIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { AssignmentStatus } from '../../admin/assignments/AssignmentStatus';
import { formatMonthDay, initials, tenureLabel } from './helpers';

export function VaTeamCard({
  assignment: a,
  displayName,
  weekHours,
  lastEod,
  loadingWork,
  loadingEods,
}: {
  assignment: IAssignment;
  displayName: string;
  weekHours: number;
  lastEod: string | null;
  loadingWork: boolean;
  loadingEods: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-sm font-medium text-text-secondary">
            {initials(displayName) || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {a.serviceType ?? 'VA Service'}
            </p>
          </div>
        </div>
        <AssignmentStatus status={a.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Hours this week</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums">
            {loadingWork ? '…' : `${weekHours.toFixed(1)}h`}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Last daily report</p>
          <p className="mt-0.5 text-base font-semibold">
            {loadingEods ? '…' : lastEod ? formatMonthDay(lastEod) : 'None'}
          </p>
        </div>
      </div>

      <dl className="space-y-2 border-t border-border pt-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Started</dt>
          <dd className="text-right">
            {formatDateKeyLong(a.startDate)}
            {!a.endDate && (
              <span className="text-muted-foreground">
                {' · '}
                {tenureLabel(a.startDate)}
              </span>
            )}
          </dd>
        </div>
        {(a.accountManagerName || a.accountManagerEmail) && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Account manager</dt>
            <dd className="min-w-0 text-right">
              {a.accountManagerName && (
                <p className="truncate">{a.accountManagerName}</p>
              )}
              {a.accountManagerEmail && (
                <a
                  href={`mailto:${a.accountManagerEmail}`}
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MailIcon className="size-3 shrink-0" />
                  <span className="truncate">{a.accountManagerEmail}</span>
                </a>
              )}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
