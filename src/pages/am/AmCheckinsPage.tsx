import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QK } from '@/hooks/queries';
import { formatDateKeyLong } from '@/lib/time';
import { updateSurveyReminder } from '@/services/survey-reminders.service';
import type { ISurveyReminder, SurveyStatus } from '@/types/survey-reminder';

import { buildCheckinColumns } from './checkins/columns';
import { dueKey, SURVEY_TYPE_LABELS } from './checkins/helpers';
import { useAmCheckins } from './checkins/use-am-checkins';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

type View = 'todo' | 'done' | 'all';

function Group({
  title,
  rows,
  alert,
  columns,
}: {
  title: string;
  rows: ISurveyReminder[];
  alert?: boolean;
  columns: ColumnDef<ISurveyReminder>[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span
          className={`text-xs tabular-nums ${alert ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {rows.length}
        </span>
      </div>
      <DataTable columns={columns} data={rows} isLoading={false} />
    </section>
  );
}

export default function AmCheckinsPage() {
  const queryClient = useQueryClient();
  const c = useAmCheckins();
  const [view, setView] = useState<View>('todo');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [skipTarget, setSkipTarget] = useState<ISurveyReminder | null>(null);

  async function handleUpdateStatus(id: string, status: SurveyStatus) {
    setBusyId(id);
    setUpdateError(null);
    try {
      await updateSurveyReminder(id, {
        status,
        ...(status === 'completed'
          ? { completedDate: new Date().toISOString() }
          : {}),
      });
      queryClient.invalidateQueries({ queryKey: QK.surveyReminders });
    } catch {
      setUpdateError('Failed to update the check-in. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  const columns = useMemo(
    () =>
      buildCheckinColumns({
        relatedInfo: c.relatedInfo,
        today: c.today,
        busyId,
        onDone: r => handleUpdateStatus(r._id, 'completed'),
        onSkip: setSkipTarget,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c.relatedInfo, c.today, busyId]
  );

  // Search matches the VA, the client or the kind of check-in.
  const query = search.trim().toLowerCase();
  const filter = (rows: ISurveyReminder[]) =>
    query
      ? rows.filter(r => {
          const info = c.relatedInfo.get(r.relatedId);
          return `${info?.title ?? ''} ${info?.subtitle ?? ''} ${SURVEY_TYPE_LABELS[r.surveyType] ?? ''}`
            .toLowerCase()
            .includes(query);
        })
      : rows;

  const overdue = filter(c.groups.overdue);
  const thisWeek = filter(c.groups.thisWeek);
  const later = filter(c.groups.later);
  const done = filter(c.groups.done);
  const open = [...overdue, ...thisWeek, ...later];
  const all = [...open, ...done];

  const shown = view === 'todo' ? open.length : view === 'done' ? done.length : all.length;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Check-ins</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Scheduled follow-ups with your VAs and clients
            </p>
          </div>

          <Tabs value={view} onValueChange={v => setView(v as View)}>
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="todo" className={TAB}>
                To do
                {!c.isLoading && (
                  <span
                    className={`text-xs font-normal tabular-nums ${c.groups.overdue.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {c.groups.openCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="done" className={TAB}>
                Done
                {!c.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {c.groups.done.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className={TAB}>
                All
                {!c.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {c.reminders.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="my-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search VA or client…"
                aria-label="Search check-ins"
                className="h-8 pl-8 text-sm"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {c.isLoading
                ? ''
                : `${shown} check-in${shown !== 1 ? 's' : ''}`}
              {!c.isLoading && c.groups.overdue.length > 0 && view !== 'done' && (
                <span className="text-destructive">
                  {' '}
                  · {c.groups.overdue.length} overdue
                </span>
              )}
            </span>
          </div>

          {updateError && (
            <p className="mb-2 text-sm text-destructive">{updateError}</p>
          )}

          {c.isLoading ? (
            <DataTable columns={columns} data={[]} isLoading />
          ) : view === 'todo' ? (
            open.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                {search
                  ? 'No check-ins match your search.'
                  : 'You’re all caught up — no check-ins to do.'}
              </div>
            ) : (
              <div className="space-y-6">
                <Group title="Overdue" rows={overdue} alert columns={columns} />
                <Group title="Due this week" rows={thisWeek} columns={columns} />
                <Group title="Later" rows={later} columns={columns} />
              </div>
            )
          ) : (
            <DataTable
              columns={columns}
              data={view === 'done' ? done : all}
              isLoading={false}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={skipTarget !== null}
        title="Skip this check-in?"
        description={
          skipTarget
            ? `Skip the ${SURVEY_TYPE_LABELS[skipTarget.surveyType] ?? ''} check-in due ${formatDateKeyLong(dueKey(skipTarget))}? It will move to Done as skipped.`
            : ''
        }
        confirmLabel="Skip check-in"
        variant="default"
        onConfirm={async () => {
          if (skipTarget) await handleUpdateStatus(skipTarget._id, 'skipped');
          setSkipTarget(null);
        }}
        onCancel={() => setSkipTarget(null)}
      />
    </div>
  );
}
