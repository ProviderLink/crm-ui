import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateKeyShort } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';

const MAX_ITEMS = 5;

/** Blockers VAs reported in the last week: the follow-ups for the manager. */
export function BlockersCard({
  blockers,
  loading,
  onOpen,
}: {
  blockers: IEodSubmission[];
  loading: boolean;
  onOpen: (eod: IEodSubmission) => void;
}) {
  return (
    <Card className="gap-4 p-5">
      <CardHeader className="flex-row items-baseline justify-between gap-3 space-y-0 p-0">
        <CardTitle className="text-sm font-medium">
          Blockers to follow up
        </CardTitle>
        {!loading && (
          <span
            className={`text-xs tabular-nums ${blockers.length > 0 ? 'text-status-warning' : 'text-muted-foreground'}`}
          >
            {blockers.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 pt-1">
        {loading ? (
          <Skeleton className="h-24 w-full rounded-md" />
        ) : blockers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blockers reported in the last 7 days.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {blockers.slice(0, MAX_ITEMS).map(e => (
              <li key={e._id} className="py-1 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onOpen(e)}
                  className="-mx-3 flex w-[calc(100%+1.5rem)] flex-col gap-0.5 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {e.candidateName || 'VA'}
                      {e.companyName && (
                        <span className="font-normal text-muted-foreground">
                          {' · '}
                          {e.companyName}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateKeyShort(e.date)}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-xs text-status-warning">
                    {e.blockers}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {blockers.length > MAX_ITEMS && (
          <p className="mt-3 text-xs text-muted-foreground">
            And {blockers.length - MAX_ITEMS} more in your EOD reports.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
