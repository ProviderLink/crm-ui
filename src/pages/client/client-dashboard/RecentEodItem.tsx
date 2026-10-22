import { formatDateKeyShort } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';

import { initials } from './helpers';

export function RecentEodItem({
  eod,
  displayName,
}: {
  eod: IEodSubmission;
  displayName: string;
}) {
  return (
                      <div
                        className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-[10px] font-medium mt-0.5">
                          {initials(displayName)}
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                              {formatDateKeyShort(eod.date)}
                              {' · '}
                              {eod.hoursWorked}h
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {eod.workEntries && eod.workEntries.length > 0
                              ? eod.workEntries
                                  .map(
                                    e =>
                                      `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`
                                  )
                                  .join(' · ')
                              : eod.summaryOfWork || '—'}
                          </p>
                          {eod.pendingTasks && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">
                              <span className="font-medium text-text-secondary">
                                Pending:{' '}
                              </span>
                              {eod.pendingTasks}
                            </p>
                          )}
                          {eod.blockers && (
                            <p className="text-xs text-red-400/70 line-clamp-1">
                              <span className="font-medium">Blockers: </span>
                              {eod.blockers}
                            </p>
                          )}
                        </div>
                      </div>
  );
}
