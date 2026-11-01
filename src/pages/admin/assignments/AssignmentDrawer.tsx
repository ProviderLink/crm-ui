import { PenLineIcon } from 'lucide-react';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { Button } from '@/components/ui/button';
import {
  AssignmentActivityTabs,
  AssignmentDetailFallback,
  AssignmentHeaderContent,
  AssignmentNotes,
  AssignmentParties,
  AssignmentWeekStats,
} from '@/features/assignments/detail-parts';
import {
  useActiveAccountManagersQuery,
  useAssignmentQuery,
  useAtsVAsQuery,
  useClientAccountQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useProvisionedClientsQuery,
  useVaProfileQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { todayString, weekStartOfDateKey } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

/**
 * An assignment opened in a floating drawer over the list. The detail only
 * mounts while one is open, so its filters and tab start fresh each time.
 */
export function AssignmentDrawer({
  assignmentId,
  onEdit,
  onClose,
}: {
  assignmentId: string | null;
  onEdit: (a: IAssignment) => void;
  onClose: () => void;
}) {
  return (
    <DetailDrawer
      open={!!assignmentId}
      onOpenChange={open => !open && onClose()}
      width="3xl"
      srTitle="Assignment details"
      srDescription="The VA, client, activity and reports for this assignment."
    >
      {assignmentId && (
        <AssignmentDetail
          key={assignmentId}
          id={assignmentId}
          onEdit={onEdit}
        />
      )}
    </DetailDrawer>
  );
}

function AssignmentDetail({
  id,
  onEdit,
}: {
  id: string;
  onEdit: (a: IAssignment) => void;
}) {
  const { data: assignment = null, isLoading: loadingAssignment } =
    useAssignmentQuery(id);

  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: crmClients = [] } = useProvisionedClientsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery();
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
  const { data: reviews = [] } = usePerformanceReviewsQuery(
    assignment ? { candidateId: assignment.candidateId } : undefined
  );

  if (!assignment)
    return <AssignmentDetailFallback loading={loadingAssignment} />;

  const va = atsVAs.find(v => v.id === assignment.candidateId);
  const vaName = va ? `${va.firstName} ${va.lastName}` : 'VA';
  const clientName =
    crmClients.find(c => c.clientId === assignment.clientId)?.companyName ??
    'Client';
  const manager = accountManagers.find(
    u => u.id === assignment.accountManagerId
  );

  return (
    <>
      <DrawerHeader>
        <AssignmentHeaderContent
          assignment={assignment}
          vaName={vaName}
          clientName={clientName}
          action={
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={() => onEdit(assignment)}
            >
              <PenLineIcon className="size-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          }
        />
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          <AssignmentParties
            vaName={vaName}
            vaEmail={va?.email}
            vaProfile={vaProfile}
            managerName={
              manager ? `${manager.firstName} ${manager.lastName}` : '—'
            }
            managerEmail={manager?.email}
            clientName={clientName}
            clientAccount={clientAccount}
          />

          <AssignmentWeekStats
            entries={entries}
            eods={eods}
            assignmentId={id}
            weekStart={weekStartOfDateKey(todayString())}
            reviewCount={
              reviews.filter(r => r.clientId === assignment.clientId).length
            }
            reportsLabel="EODs"
          />

          {assignment.notes && <AssignmentNotes notes={assignment.notes} />}

          <AssignmentActivityTabs
            assignmentId={id}
            entries={entries}
            eods={eods}
            loadingEntries={loadingEntries}
            loadingEods={loadingEods}
            reportsLabel="EOD reports"
          />
        </div>
      </div>
    </>
  );
}
