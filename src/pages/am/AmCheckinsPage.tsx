import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorNotice } from '@/components/shared/ErrorNotice';
import { DataTable } from '@/components/shared/DataTable';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs } from '@/components/ui/tabs';
import { useUpdateSurveyReminder } from '@/hooks/mutations';
import { formatDateKeyLong } from '@/lib/time';
import { dueKey } from '@/lib/survey';
import {
  SURVEY_TYPE_LABELS,
  type ISurveyReminder,
  type SurveyStatus,
} from '@/types/survey-reminder';

import { buildCheckinColumns } from './checkins/columns';
import { useAmCheckins } from './checkins/use-am-checkins';

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
  const c = useAmCheckins();
  const [view, setView] = useState<View>('todo');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const update = useUpdateSurveyReminder(
    'Failed to update the check-in. Please try again.'
  );
  const updateError = update.error;
  const [skipTarget, setSkipTarget] = useState<ISurveyReminder | null>(null);

  const { run: runUpdate } = update;
  const handleUpdateStatus = useCallback(
    async (id: string, status: SurveyStatus) => {
      setBusyId(id);
      await runUpdate({ id, status });
      setBusyId(null);
    },
    [runUpdate]
  );

  const columns = useMemo(
    () =>
      buildCheckinColumns({
        relatedInfo: c.relatedInfo,
        today: c.today,
        busyId,
        onDone: r => void handleUpdateStatus(r._id, 'completed'),
        onSkip: setSkipTarget,
      }),
    [c.relatedInfo, c.today, busyId, handleUpdateStatus]
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

  const shown =
    view === 'todo' ? open.length : view === 'done' ? done.length : all.length;

  return (
    <Page
      overlays={
        <>
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
              if (skipTarget)
                await handleUpdateStatus(skipTarget._id, 'skipped');
              setSkipTarget(null);
            }}
            onCancel={() => setSkipTarget(null)}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Check-ins"
          description="Scheduled follow-ups with your VAs and clients"
        />

        <Tabs value={view} onValueChange={v => setView(v as View)}>
          <UnderlineTabsList>
            <UnderlineTab value="todo">
              To do
              {!c.isLoading && (
                <TabCount alert={c.groups.overdue.length > 0}>
                  {c.groups.openCount}
                </TabCount>
              )}
            </UnderlineTab>
            <UnderlineTab value="done">
              Done
              {!c.isLoading && <TabCount>{c.groups.done.length}</TabCount>}
            </UnderlineTab>
            <UnderlineTab value="all">
              All
              {!c.isLoading && <TabCount>{c.reminders.length}</TabCount>}
            </UnderlineTab>
          </UnderlineTabsList>
        </Tabs>

        <div className="my-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search VA or client…"
            label="Search check-ins"
          />
          {search && <ClearFiltersButton onClick={() => setSearch('')} />}
          <span className="ml-auto text-xs text-muted-foreground">
            {c.isLoading ? '' : `${shown} check-in${shown !== 1 ? 's' : ''}`}
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

        {c.isError ? (
          <ErrorNotice error={c.error} />
        ) : c.isLoading ? (
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
      </PageSection>
    </Page>
  );
}
