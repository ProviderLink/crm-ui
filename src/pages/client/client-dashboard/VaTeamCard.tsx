import { MailIcon } from 'lucide-react';

import { AssignmentStatusPill, InitialsTile } from '@/components/shared/badges';
import { StatTile } from '@/components/shared/StatTile';
import { Card } from '@/components/ui/card';

import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { formatMonthDay, tenureLabel } from './helpers';

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
          <InitialsTile name={displayName} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {a.serviceType ?? 'VA Service'}
            </p>
          </div>
        </div>
        <AssignmentStatusPill status={a.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Hours this week"
          value={loadingWork ? '…' : `${weekHours.toFixed(1)}h`}
        />
        <StatTile
          label="Last daily report"
          value={loadingEods ? '…' : lastEod ? formatMonthDay(lastEod) : 'None'}
        />
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
