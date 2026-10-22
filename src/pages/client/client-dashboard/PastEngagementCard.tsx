import { BriefcaseIcon, CalendarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { initials } from './helpers';

export function PastEngagementCard({
  assignment: a,
  displayName,
}: {
  assignment: IAssignment;
  displayName: string;
}) {
  return (
                  <Card className="flex flex-col gap-0 opacity-60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
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
                          className="border-muted text-muted-foreground bg-transparent shrink-0"
                        >
                          Ended
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0 flex flex-col gap-2">
                      {a.serviceType && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BriefcaseIcon className="size-3 shrink-0" />
                          {a.serviceType}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarIcon className="size-3 shrink-0" />
                        {formatDateKeyLong(a.startDate)}
                        {a.endDate ? ` – ${formatDateKeyLong(a.endDate)}` : ''}
                      </span>
                    </CardContent>
                  </Card>
  );
}
