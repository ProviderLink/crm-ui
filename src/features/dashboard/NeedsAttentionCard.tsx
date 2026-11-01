import { ArrowRightIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useEodContextQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useSurveyRemindersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { todayString } from '@/lib/time';

const MAX_ITEMS = 4;

type Item = { key: string; title: string; note: string };

function Group({
  title,
  count,
  items,
  to,
  linkLabel,
  emptyLabel,
}: {
  title: string;
  count: number;
  items: Item[];
  to: string;
  linkLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span
          className={`text-xs tabular-nums ${count > 0 ? 'text-status-warning' : 'text-muted-foreground'}`}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.slice(0, MAX_ITEMS).map(i => (
              <li key={i.key} className="min-w-0">
                <p className="truncate text-sm" title={i.title}>
                  {i.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {i.note}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {count > MAX_ITEMS ? `${linkLabel} (${count})` : linkLabel}
            <ArrowRightIcon className="size-3" />
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * What an admin or account manager should act on now: missing EODs, overdue
 * survey reminders and reviews still being drafted. Each group links to its page.
 */
export function NeedsAttentionCard({ prefix }: { prefix: '/admin' | '/am' }) {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();

  // Assignments are already scoped to the manager's own for an AM.
  const { data: assignments = [], isLoading: l1 } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const { data: eodsToday = [], isLoading: l2 } = useEodSubmissionsQuery({
    date: today,
  });
  const { data: reminders = [], isLoading: l3 } = useSurveyRemindersQuery();
  const { data: reviews = [], isLoading: l4 } = usePerformanceReviewsQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const loading = l1 || l2 || l3 || l4;

  const vaName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of atsVAs) m[v.id] = `${v.firstName} ${v.lastName}`;
    return m;
  }, [atsVAs]);
  const clientName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of atsClients) m[c.id] = c.companyName;
    return m;
  }, [atsClients]);

  const missing = useMemo<Item[]>(() => {
    const done = new Set(eodsToday.map(e => e.assignmentId));
    return assignments
      .filter(a => a.status === 'active' && !done.has(a._id))
      .map(a => ({
        key: a._id,
        title: a.candidateName || vaName[a.candidateId] || 'VA',
        note: a.companyName || clientName[a.clientId] || '',
      }));
  }, [assignments, eodsToday, vaName, clientName]);

  // For an AM, only reminders and reviews tied to their own assignments.
  const scoped = useMemo(() => {
    if (!isAccountManager) return null;
    const ids = new Set<string>();
    for (const a of assignments) {
      ids.add(a._id);
      if (a.candidateId) ids.add(a.candidateId);
      if (a.clientId) ids.add(a.clientId);
    }
    return ids;
  }, [isAccountManager, assignments]);

  const overdue = useMemo<Item[]>(() => {
    const byId = new Map<string, string>();
    for (const a of assignments)
      byId.set(
        a._id,
        a.candidateName || vaName[a.candidateId] || a.companyName || ''
      );
    return reminders
      .filter(r => r.status === 'pending' || r.status === 'sent')
      .filter(r => (r.dueDate?.slice(0, 10) ?? '') < today)
      .filter(r => !scoped || scoped.has(r.relatedId))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map(r => ({
        key: r._id,
        title:
          byId.get(r.relatedId) ||
          vaName[r.relatedId] ||
          clientName[r.relatedId] ||
          'Reminder',
        note: `${r.surveyType.replace('_', '-')} survey · due ${r.dueDate.slice(0, 10)}`,
      }));
  }, [reminders, assignments, vaName, clientName, today, scoped]);

  const drafts = useMemo<Item[]>(
    () =>
      reviews
        .filter(
          r =>
            r.reviewStatus === 'Draft' ||
            r.reviewStatus === 'AI Generated' ||
            r.reviewStatus === 'In Review'
        )
        .filter(
          r => !scoped || scoped.has(r.vaId) || scoped.has(r.clientId)
        )
        .map(r => ({
          key: r.id,
          title: r.candidateName ?? vaName[r.vaId] ?? 'VA',
          note: `${r.reviewType} review · ${r.reviewStatus}`,
        })),
    [reviews, vaName, scoped]
  );

  return (
    <Card className="gap-4 p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-medium">Needs attention</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        {loading ? (
          <Skeleton className="h-24 w-full rounded-md" />
        ) : (
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
            <Group
              title="Missing EODs today"
              count={missing.length}
              items={missing}
              to={`${prefix}/eod-reports`}
              linkLabel="View EOD reports"
              emptyLabel="Everyone has reported."
            />
            <Group
              title="Overdue reminders"
              count={overdue.length}
              items={overdue}
              to={`${prefix}/reminders`}
              linkLabel="View reminders"
              emptyLabel="Nothing overdue."
            />
            <Group
              title="Reviews in progress"
              count={drafts.length}
              items={drafts}
              to={`${prefix}/performance-reviews`}
              linkLabel="View reviews"
              emptyLabel="No open reviews."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
