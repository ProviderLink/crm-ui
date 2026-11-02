import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Page, PageSection } from '@/components/shared/PageLayout';
import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  ASSIGNMENT_KEYS,
  useActiveAccountManagersQuery,
  useAllAssignmentsQuery,
  useAtsVAsQuery,
  useProvisionedClientsQuery,
} from '@/hooks/queries';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { updateAssignment } from '@/services/assignments.service';
import type { IAssignment } from '@/types/assignment';
import { useQueryClient } from '@tanstack/react-query';

import { AssignmentDrawer } from './assignments/AssignmentDrawer';
import { AssignmentFilters } from './assignments/AssignmentFilters';
import { buildColumns } from './assignments/columns';
import { CreateAssignmentForm } from './assignments/CreateAssignmentForm';
import { EditAssignmentForm } from './assignments/EditAssignmentForm';

export default function AssignmentManagementPage() {
  const queryClient = useQueryClient();
  const { data: assignments = [], isLoading } = useAllAssignmentsQuery();
  // Clients provisioned with CRM access — from the dedicated CRM endpoint
  const { data: crmClients = [] } = useProvisionedClientsQuery();
  const { data: atsVas = [] } = useAtsVAsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery();

  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<IAssignment | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<IAssignment | null>(
    null
  );
  const deactivate = useApiMutation({
    mutationFn: (id: string) => updateAssignment(id, { status: 'ended' }),
    invalidate: ASSIGNMENT_KEYS,
    errorMessage: 'Failed to deactivate assignment. Please try again.',
  });
  const deactivateError = deactivate.error;

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    await deactivate.run(deactivateTarget._id);
    setDeactivateTarget(null);
  }

  function refreshAssignments() {
    for (const queryKey of ASSIGNMENT_KEYS)
      queryClient.invalidateQueries({ queryKey });
  }

  function handleSheetClose(open: boolean) {
    if (!open) setSheetMode(null);
  }

  const clientMap = useMemo(
    () => Object.fromEntries(crmClients.map(c => [c.clientId, c.companyName])),
    [crmClients]
  );
  const vaMap = useMemo(
    () =>
      Object.fromEntries(
        atsVas.map(v => [v.id, `${v.firstName} ${v.lastName}`])
      ),
    [atsVas]
  );
  const amMap = useMemo(
    () =>
      Object.fromEntries(
        accountManagers.map(u => [u.id, `${u.firstName} ${u.lastName}`])
      ),
    [accountManagers]
  );

  // Search matches the VA, the client or the service type.
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      assignments.filter(a => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (managerFilter !== 'all' && a.accountManagerId !== managerFilter)
          return false;
        if (!query) return true;
        const va = a.candidateName || vaMap[a.candidateId] || '';
        const client = a.companyName || clientMap[a.clientId] || '';
        return `${va} ${client} ${a.serviceType ?? ''}`
          .toLowerCase()
          .includes(query);
      }),
    [assignments, statusFilter, managerFilter, query, vaMap, clientMap]
  );

  const columns = buildColumns({
    clientMap,
    vaMap,
    amMap,
    onEdit: a => {
      setEditTarget(a);
      setSheetMode('edit');
    },
    onDeactivate: a => setDeactivateTarget(a),
  });

  return (
    <Page
      overlays={
        <>
          <AssignmentDrawer
            assignmentId={openAssignmentId}
            onEdit={a => {
              setOpenAssignmentId(null);
              setEditTarget(a);
              setSheetMode('edit');
            }}
            onClose={() => setOpenAssignmentId(null)}
          />

          {/* Create / edit — the same floating drawer as the detail view */}
          <DetailDrawer
            open={sheetMode !== null}
            onOpenChange={handleSheetClose}
          >
            <DrawerHeader className="block">
              <SheetTitle className="text-xl">
                {sheetMode === 'create' ? 'New Assignment' : 'Edit Assignment'}
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {sheetMode === 'create'
                  ? 'Link a VA to a client account.'
                  : 'Update the assignment details below.'}
              </SheetDescription>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {sheetMode === 'create' && (
                <CreateAssignmentForm
                  clients={crmClients}
                  assignments={assignments}
                  team={accountManagers}
                  onSuccess={() => {
                    setSheetMode(null);
                    refreshAssignments();
                  }}
                  onClose={() => setSheetMode(null)}
                />
              )}

              {sheetMode === 'edit' && editTarget && (
                <EditAssignmentForm
                  key={editTarget._id}
                  assignment={editTarget}
                  team={accountManagers}
                  onSuccess={() => {
                    setSheetMode(null);
                    refreshAssignments();
                  }}
                  onClose={() => setSheetMode(null)}
                />
              )}
            </div>
          </DetailDrawer>

          {/* End Assignment confirmation */}
          <ConfirmDialog
            open={deactivateTarget !== null}
            title="End Assignment"
            description={
              deactivateTarget
                ? `End the assignment for "${deactivateTarget.serviceType ?? deactivateTarget._id}"? This will end the active VA–client relationship.`
                : ''
            }
            confirmLabel="End Assignment"
            onConfirm={confirmDeactivate}
            onCancel={() => setDeactivateTarget(null)}
          />
        </>
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Assignments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage VA–client assignments
          </p>
        </div>
        <Button size="sm" onClick={() => setSheetMode('create')}>
          <PlusIcon className="size-4" />
          New Assignment
        </Button>
      </div>

      {/* Filters + table */}
      <PageSection>
        <AssignmentFilters
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          manager={managerFilter}
          onManagerChange={setManagerFilter}
          managers={accountManagers.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
          }))}
          recordCount={visible.length}
        />
        {deactivateError && (
          <p className="mb-2 text-sm text-destructive">{deactivateError}</p>
        )}
        <DataTable
          columns={columns}
          data={visible}
          isLoading={isLoading}
          onRowClick={a => setOpenAssignmentId(a._id)}
        />
      </PageSection>
    </Page>
  );
}
