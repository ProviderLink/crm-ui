import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
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

import { AssignmentDetailDialog } from './assignments/AssignmentDetailDialog';
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
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Assignments
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage VA–client assignments
            </p>
          </div>
          {canManageAssignments && (
            <Button onClick={() => setSheetMode('create')}>
              <PlusIcon className="size-4" />
              New Assignment
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="px-4 lg:px-6">
          {deactivateError && (
            <p className="mb-2 text-sm text-destructive">{deactivateError}</p>
          )}
          <DataTable
            columns={columns}
            data={assignments}
            isLoading={isLoading}
            onRowClick={a => setOpenAssignmentId(a._id)}
          />
        </div>
      </div>

      <AssignmentDetailDialog
        assignmentId={openAssignmentId}
        onClose={() => setOpenAssignmentId(null)}
      />

      {/* Sheet */}
      <Sheet open={sheetMode !== null} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === 'create' ? 'New Assignment' : 'Edit Assignment'}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === 'create'
                ? 'Link a VA to a client account.'
                : 'Update the assignment details below.'}
            </SheetDescription>
          </SheetHeader>

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
