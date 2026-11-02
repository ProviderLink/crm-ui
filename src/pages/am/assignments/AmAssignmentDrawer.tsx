import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { StatTile } from '@/components/shared/StatTile';
import {
  AssignmentActivityTabs,
  AssignmentDetailFallback,
  AssignmentHeaderContent,
  AssignmentNotes,
  AssignmentParties,
  AssignmentWeekStats,
} from '@/features/assignments/detail-parts';
import { NotesThread } from '@/features/notes/NotesThread';
import {
  useAssignmentQuery,
  useClientAccountQuery,
  useCrmAccountsListQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useSurveyRemindersQuery,
  useVaProfileQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { dueKey, isOpen } from '@/lib/survey';
import { isReportDue } from '@/lib/compliance';
import { addDaysToDateKey, weekStartOfDateKey } from '@/lib/time';

import { BLOCKER_DAYS, hasBlocker } from '@/lib/blockers';
import { FollowUps } from './FollowUps';

/**
 * An assignment opened in a floating drawer over the list. The detail only
 * mounts while one is open, so its filters and tab start fresh each time.
 */
export function AmAssignmentDrawer({
  assignmentId,
  today,
  onClose,
}: {
  assignmentId: string | null;
  today: string;
  onClose: () => void;
}) {
  return (
    <DetailDrawer
      open={!!assignmentId}
      onOpenChange={open => !open && onClose()}
      width="3xl"
      srTitle="Assignment details"
      srDescription="The VA, client, activity, notes and follow-ups for this assignment."
    >
      {assignmentId && (
        <AmAssignmentDetail
          key={assignmentId}
          id={assignmentId}
          today={today}
        />
      )}
    </DetailDrawer>
  );
}

function AmAssignmentDetail({ id, today }: { id: string; today: string }) {
  const { data: assignment = null, isLoading: loadingAssignment } =
    useAssignmentQuery(id);

  // Only this assignment's rows, filtered by the server.
  const { data: entries = [], isLoading: loadingEntries } = useWorkEntriesQuery(
    { assignmentId: id }
  );
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery({
    assignmentId: id,
  });

  const { data: clientAccount = null } = useClientAccountQuery(
    assignment?.clientId
  );
  const { data: vaProfile = null } = useVaProfileQuery(assignment?.candidateId);
  // The VA's email comes from the manager's own (scoped) account list.
  const { data: crmAccounts } = useCrmAccountsListQuery();
  const { data: allReviews = [] } = usePerformanceReviewsQuery(
    assignment ? { candidateId: assignment.candidateId } : undefined
  );
  const { data: allReminders = [] } = useSurveyRemindersQuery();

  if (!assignment)
    return <AssignmentDetailFallback loading={loadingAssignment} />;

  const vaName = assignment.candidateName || 'VA';
  const clientName = assignment.companyName || 'Client';
  const vaEmail =
    crmAccounts?.vas.find(v => v.candidateRef === assignment.candidateId)
      ?.email ?? null;

  // Reviews of this VA for this client, and reminders tied to this assignment,
  // its VA or its client.
  const reviews = allReviews.filter(r => r.clientId === assignment.clientId);
  const related = new Set([id, assignment.candidateId, assignment.clientId]);
  const reminders = allReminders
    .filter(r => related.has(r.relatedId))
    .sort((a, b) => {
      if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
      return dueKey(a).localeCompare(dueKey(b));
    });

  // What needs attention
  const submittedToday = eods.some(e => e.date === today);
  const blockerFrom = addDaysToDateKey(today, -BLOCKER_DAYS);
  const blockers = eods.filter(e => e.date >= blockerFrom && hasBlocker(e));
  const overdue = reminders.filter(
    r => isOpen(r) && (r.dueDate?.slice(0, 10) ?? '') < today
  );
  const todayLabel =
    assignment.status === 'active'
      ? submittedToday
        ? 'Submitted'
        : isReportDue(assignment, today)
          ? 'Missing'
          : 'Not due'
      : '—';

  return (
    <>
      <DrawerHeader>
        <AssignmentHeaderContent
          assignment={assignment}
          vaName={vaName}
          clientName={clientName}
        />
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* What needs attention */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Report today"
              value={todayLabel}
              alert={todayLabel === 'Missing'}
            />
            <StatTile
              label="Blockers, last 7 days"
              value={blockers.length}
              alert={blockers.length > 0}
            />
            <StatTile
              label="Overdue check-ins"
              value={overdue.length}
              alert={overdue.length > 0}
            />
          </div>

          <AssignmentParties
            vaName={vaName}
            vaEmail={vaEmail}
            vaProfile={vaProfile}
            managerName={assignment.accountManagerName || '—'}
            managerEmail={assignment.accountManagerEmail}
            clientName={clientName}
            clientAccount={clientAccount}
          />

          <AssignmentWeekStats
            entries={entries}
            eods={eods}
            assignmentId={id}
            weekStart={weekStartOfDateKey(today)}
            reviewCount={reviews.length}
            reportsLabel="Reports"
          />

          {assignment.notes && (
            <AssignmentNotes
              notes={assignment.notes}
              title="Assignment notes"
            />
          )}

          <AssignmentActivityTabs
            assignmentId={id}
            entries={entries}
            eods={eods}
            loadingEntries={loadingEntries}
            loadingEods={loadingEods}
            reportsLabel="Reports"
            extraTabs={[
              {
                value: 'notes',
                label: 'Notes',
                className: 'mt-4 space-y-5',
                content: (
                  <>
                    <NotesThread
                      subjectType="va"
                      subjectId={assignment.candidateId}
                      title={`Notes on ${vaName}`}
                    />
                    <NotesThread
                      subjectType="client"
                      subjectId={assignment.clientId}
                      title={`Notes on ${clientName}`}
                    />
                  </>
                ),
              },
              {
                value: 'followups',
                label: <>Reviews &amp; check-ins</>,
                className: 'mt-4 space-y-6',
                content: (
                  <>
                    <FollowUps
                      reminders={reminders}
                      reviews={reviews}
                      today={today}
                    />
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
