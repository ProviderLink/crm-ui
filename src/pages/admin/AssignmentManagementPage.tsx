import { PlusIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useActiveAccountManagersQuery,
  useAllAssignmentsQuery,
  useAtsVAsQuery,
  useProvisionedClientsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
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
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';
  // AMs can only view their own assignments; only admins can create/edit/delete
  const canManageAssignments = user?.role === 'admin';
  const { data: assignments = [], isLoading } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  // Clients provisioned with CRM access — from the dedicated CRM endpoint
  const { data: crmClients = [] } = useProvisionedClientsQuery();
  const { data: atsVas = [] } = useAtsVAsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery(
    user?.role !== 'account_manager'
  );

  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<IAssignment | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<IAssignment | null>(
    null
  );
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivateError(null);
    try {
      await updateAssignment(deactivateTarget._id, { status: 'ended' });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'all'] });
    } catch {
      setDeactivateError('Failed to deactivate assignment. Please try again.');
    } finally {
      setDeactivateTarget(null);
    }
  }

  function handleSheetClose(open: boolean) {
    if (!open) setSheetMode(null);
  }

  const clientMap: Record<string, string> = {};
  for (const c of crmClients) clientMap[c.clientId] = c.companyName;

  const vaMap: Record<string, string> = {};
  for (const v of atsVas) vaMap[v.id] = `${v.firstName} ${v.lastName}`;

  const amMap: Record<string, string> = {};
  for (const u of accountManagers) amMap[u.id] = `${u.firstName} ${u.lastName}`;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, statusFilter, managerFilter, query, atsVas, crmClients]
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
    canManage: canManageAssignments,
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
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
          {canManageAssignments && (
            <Button size="sm" onClick={() => setSheetMode('create')}>
              <PlusIcon className="size-4" />
              New Assignment
            </Button>
          )}
        </div>

        {/* Filters + table */}
        <div className="px-4 lg:px-6">
          <AssignmentFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            manager={isAccountManager ? null : managerFilter}
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
        </div>
      </div>

      <AssignmentDrawer
        assignmentId={openAssignmentId}
        canManage={canManageAssignments}
        onEdit={a => {
          setOpenAssignmentId(null);
          setEditTarget(a);
          setSheetMode('edit');
        }}
        onClose={() => setOpenAssignmentId(null)}
      />

      {/* Create / edit — the same floating drawer as the detail view */}
      <Sheet open={sheetMode !== null} onOpenChange={handleSheetClose}>
        <SheetContent
          side="right"
          className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-lg [&>button:last-child]:hidden"
        >
          <SheetClose asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Close"
              className="absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised min-[600px]:-left-11 min-[600px]:right-auto min-[600px]:top-0"
            >
              <XIcon className="size-4" />
            </Button>
          </SheetClose>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
            <header className="border-b border-border px-6 py-4 pr-14 min-[600px]:pr-6">
              <SheetTitle className="text-xl">
                {sheetMode === 'create' ? 'New Assignment' : 'Edit Assignment'}
              </SheetTitle>
              <SheetDescription className="mt-0.5">
                {sheetMode === 'create'
                  ? 'Link a VA to a client account.'
                  : 'Update the assignment details below.'}
              </SheetDescription>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {sheetMode === 'create' && (
                <CreateAssignmentForm
                  clients={crmClients}
                  assignments={assignments}
                  team={accountManagers}
                  onSuccess={() => {
                    setSheetMode(null);
                    queryClient.invalidateQueries({
                      queryKey: ['assignments', 'all'],
                    });
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
                    queryClient.invalidateQueries({
                      queryKey: ['assignments', 'all'],
                    });
                  }}
                  onClose={() => setSheetMode(null)}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
    </div>
  );
}
