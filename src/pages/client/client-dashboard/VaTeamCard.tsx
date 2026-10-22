import {
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  ShieldCheckIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import {
  assignmentBadge,
  formatMonthDay,
  initials,
  tenureLabel,
} from './helpers';

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
  const badge = assignmentBadge[a.status];
  return (
                  <Card className="flex flex-col gap-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-xs font-medium">
                            {initials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                              VA
                            </p>
                            <CardTitle className="text-base leading-snug">
                              {displayName}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${badge.className} shrink-0`}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pb-4 pt-0">
                      {/* Role */}
                      {a.serviceType && (
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                            Role
                          </p>
                          <span className="flex items-center gap-1.5 text-sm text-foreground">
                            <BriefcaseIcon className="size-3 shrink-0 text-muted-foreground" />
                            {a.serviceType}
                          </span>
                        </div>
                      )}

                      {/* Duration */}
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                          Duration
                        </p>
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarIcon className="size-3 shrink-0 text-muted-foreground" />
                          {formatDateKeyLong(a.startDate)}
                          <span className="text-muted-foreground">→</span>
                          {a.endDate ? (
                            formatDateKeyLong(a.endDate)
                          ) : (
                            <span className="text-green-400">
                              Present · {tenureLabel(a.startDate)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Account Manager */}
                      {(a.accountManagerName || a.accountManagerEmail) && (
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                            Account Manager
                          </p>
                          {a.accountManagerName && (
                            <span className="flex items-center gap-1.5 text-sm text-foreground">
                              <ShieldCheckIcon className="size-3 shrink-0 text-muted-foreground" />
                              {a.accountManagerName}
                            </span>
                          )}
                          {a.accountManagerEmail && (
                            <a
                              href={`mailto:${a.accountManagerEmail}`}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-0.5 transition-colors"
                            >
                              <MailIcon className="size-3 shrink-0" />
                              {a.accountManagerEmail}
                            </a>
                          )}
                        </div>
                      )}

                      {/* This week stats */}
                      <div className="flex items-center gap-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 mt-1">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            This week
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {loadingWork ? '…' : `${weekHours.toFixed(1)}h`}
                          </p>
                        </div>
                        <div className="w-px self-stretch bg-white/[0.06]" />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Last EOD
                          </p>
                          <p className="text-sm font-semibold">
                            {loadingEods
                              ? '…'
                              : lastEod
                                ? formatMonthDay(lastEod)
                                : 'None'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  );
}
