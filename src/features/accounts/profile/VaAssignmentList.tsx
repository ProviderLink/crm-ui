import { BuildingIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react';

import type { IVaAssignment } from '@/types/va-profile';

import { durationLabel, fmtDate } from '../date-utils';

const STATUS: Record<IVaAssignment['status'], { label: string; tone: string }> =
  {
    active: { label: 'Active', tone: 'text-status-success' },
    on_hold: { label: 'On Hold', tone: 'text-status-warning' },
    ended: { label: 'Ended', tone: 'text-text-secondary' },
  };

/** The clients a VA works for, with status, dates and notes. */
export function VaAssignmentList({
  assignments,
}: {
  assignments: IVaAssignment[];
}) {
  return (
    <>
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-foreground">
          Client Assignments
        </span>
        <span className="text-[11px] text-muted-foreground">
          {assignments.length} total
        </span>
      </div>

      {assignments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No assignments found.
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const status = STATUS[a.status];
            return (
              <div
                key={a._id}
                className="space-y-2 rounded-lg border border-white/[0.1] bg-white/[0.03] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BuildingIcon className="size-3 shrink-0 text-muted-foreground" />
                      <p className="truncate text-sm leading-tight font-medium">
                        {a.companyName || 'Unknown Client'}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.serviceType}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium ${status?.tone ?? 'text-muted-foreground'}`}
                  >
                    {status?.label ?? a.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {fmtDate(a.startDate)}
                    {a.endDate ? ` → ${fmtDate(a.endDate)}` : ' → Present'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUpIcon className="size-3" />
                    {durationLabel(a.startDate, a.endDate)}
                  </span>
                </div>
                {a.notes && (
                  <p className="border-t border-white/[0.06] pt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {a.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
