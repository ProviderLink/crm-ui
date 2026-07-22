import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  EyeIcon,
  PenLineIcon,
  PlusIcon,
  StickyNote,
  Users2,
  XIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  QK,
  useActiveAccountManagersQuery,
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import type { IAccountManager } from '@/services/account-managers.service';
import {
  createAssignment,
  updateAssignment,
} from '@/services/assignments.service';
import type { IAssignment } from '@/types/assignment';
import type { IAtsCandidate, IAtsClient } from '@/types/ats';
import { useQueryClient } from '@tanstack/react-query';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  clientId: z.string().min(1, 'Required'),
  candidateId: z.string().min(1, 'Required'),
  accountManagerId: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'ended']),
  serviceType: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
  accountManagerId: z.string().min(1, 'Required'),
  status: z.enum(['active', 'on_hold', 'ended']),
  serviceType: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the date string (yyyy-MM-dd) only if it represents a real date after year 2000.
 *  Filters out epoch garbage (1970-01-01) that Firestore stores when null is passed. */
function sanitizeDate(value: string | undefined | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '';
  return value.slice(0, 10);
}

function buildColumns(
  clientMap: Record<string, string>,
  vaMap: Record<string, string>,
  amMap: Record<string, string>,
  onEdit: (a: IAssignment) => void,
  onDeactivate: (a: IAssignment) => void,
  canManage: boolean,
  rolePrefix: string
): ColumnDef<IAssignment>[] {
  const columns: ColumnDef<IAssignment>[] = [
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 210,
      cell: ({ getValue }) =>
        clientMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 130,
      cell: ({ getValue }) => vaMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'accountManagerId',
      header: 'Account Manager',
      size: 165,
      cell: ({ getValue }) => amMap[getValue<string>() ?? ''] ?? '—',
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 115,
      cell: ({ getValue }) => getValue<string>()?.slice(0, 10) ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 90,
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const styles =
          {
            active:
              'bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-green-500/20',
            on_hold:
              'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20',
            ended: 'bg-muted text-muted-foreground ring-1 ring-border',
          }[v] ?? 'bg-muted text-muted-foreground ring-1 ring-border';
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap ${styles}`}
          >
            {v}
          </span>
        );
      },
    },
    {
      accessorKey: 'serviceType',
      header: 'Service Type',
      cell: ({ getValue }) => getValue<string>() ?? '—',
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  asChild
                >
                  <Link to={`${rolePrefix}/assignments/${row.original._id}`}>
                    <EyeIcon className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View Details</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  onClick={() => onEdit(row.original)}
                >
                  <PenLineIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>

            {row.original.status !== 'ended' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-destructive/[0.04] text-destructive/60 hover:text-destructive hover:bg-destructive/[0.08]"
                    onClick={() => onDeactivate(row.original)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">End Assignment</TooltipContent>
              </Tooltip>
            ) : (
              <div className="size-7" />
            )}
          </div>
        </TooltipProvider>
      ),
    });
  }

  return columns;
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  optional = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {optional && (
          <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Optional
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateAssignmentForm({
  clients,
  vas,
  assignments,
  team,
  onSuccess,
  onClose,
}: {
  clients: IAtsClient[];
  vas: IAtsCandidate[];
  assignments: IAssignment[];
  team: IAccountManager[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'active' },
  });

  const selectedClientId = watch('clientId');

  // Filter VAs to only those hired by the selected client
  const filteredVas = selectedClientId
    ? vas.filter(v => v.clientIds?.includes(selectedClientId))
    : [];

  // Build a set of candidateIds that have an active/on_hold assignment
  const activeCandidateIds = new Set(
    assignments
      .filter(a => a.status === 'active' || a.status === 'on_hold')
      .map(a => a.candidateId)
  );

  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateFormData) {
    setServerError('');
    try {
      await createAssignment(data);
      onSuccess();
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(
        apiMsg ?? 'Failed to create assignment. Please try again.'
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 space-y-4"
    >
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── People ── */}
      <Section icon={<Users2 size={14} />} title="People">
        <Field label="Client" error={errors.clientId?.message}>
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={v => {
                  field.onChange(v);
                  setValue('candidateId', '');
                }}
              >
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Virtual Assistant"
          error={errors.candidateId?.message}
          hint={
            !selectedClientId
              ? 'Select a client first to see their hired VAs'
              : filteredVas.length === 0
                ? 'No hired VAs found for this client'
                : undefined
          }
        >
          <Controller
            control={control}
            name="candidateId"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={!selectedClientId || filteredVas.length === 0}
              >
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue
                    placeholder={
                      selectedClientId ? 'Select VA' : 'Select client first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredVas.map(v => {
                    const hasAssignment = activeCandidateIds.has(v.id);
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex items-center gap-2">
                          {v.firstName} {v.lastName}
                          {hasAssignment ? (
                            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-0.5 bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20">
                              Assigned
                            </span>
                          ) : (
                            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-0.5 bg-green-500/15 text-green-700 ring-1 ring-green-500/20">
                              Free
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Account Manager" error={errors.accountManagerId?.message}>
          <Controller
            control={control}
            name="accountManagerId"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue placeholder="Select account manager" />
                </SelectTrigger>
                <SelectContent>
                  {team.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </Section>

      {/* ── Service ── */}
      <Section icon={<Briefcase size={14} />} title="Service">
        <div className="grid grid-cols-[3fr_2fr] gap-4 items-end">
          <Field
            label="Service Type"
            error={errors.serviceType?.message}
            hint="e.g. Medical VA, Admin Support"
          >
            <Input
              {...register('serviceType')}
              placeholder="Service type"
              className="rounded-xl border-input h-10"
            />
          </Field>

          <Field label="Status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-input h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </Section>

      {/* ── Timeline ── */}
      <Section icon={<CalendarDays size={14} />} title="Timeline">
        <div className="grid grid-cols-2 gap-4 items-end">
          <Field label="Start Date" error={errors.startDate?.message}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <Field
            label="End Date"
            error={errors.endDate?.message}
            hint="Leave blank if ongoing"
          >
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section icon={<StickyNote size={14} />} title="Notes" optional>
        <Field label="" error={errors.notes?.message}>
          <Textarea
            {...register('notes')}
            placeholder="Any additional notes…"
            className="rounded-xl border-input resize-none"
            rows={3}
          />
        </Field>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl h-10 font-medium gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Create Assignment
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditAssignmentForm({
  assignment,
  team,
  onSuccess,
  onClose,
}: {
  assignment: IAssignment;
  team: IAccountManager[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      accountManagerId: assignment.accountManagerId ?? '',
      status: assignment.status,
      serviceType: assignment.serviceType ?? '',
      endDate: sanitizeDate(assignment.endDate),
      notes: assignment.notes ?? '',
    },
  });

  const [serverError, setServerError] = useState('');

  async function onSubmit(data: EditFormData) {
    setServerError('');
    try {
      const { endDate, ...rest } = data;
      await updateAssignment(assignment._id, {
        ...rest,
        // Empty string = user cleared the field → send null so backend deletes it from Firestore
        // Value present → send as-is
        endDate: endDate || null,
      });
      onSuccess();
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(apiMsg ?? 'Failed to save changes. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 space-y-4"
    >
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Assignment Details ── */}
      <Section icon={<Briefcase size={14} />} title="Assignment Details">
        <Field label="Account Manager" error={errors.accountManagerId?.message}>
          <Controller
            control={control}
            name="accountManagerId"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue placeholder="Select account manager" />
                </SelectTrigger>
                <SelectContent>
                  {team.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className="grid grid-cols-[3fr_2fr] gap-4 items-end">
          <Field
            label="Service Type"
            error={errors.serviceType?.message}
            hint="e.g. Medical VA, Admin Support"
          >
            <Input
              {...register('serviceType')}
              placeholder="Service type"
              className="rounded-xl border-input h-10"
            />
          </Field>

          <Field label="Status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-input h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </Section>

      {/* ── Timeline ── */}
      <Section icon={<CalendarDays size={14} />} title="Timeline">
        <Field
          label="End Date"
          error={errors.endDate?.message}
          hint="Leave blank if still ongoing"
        >
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  className="flex-1"
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange('')}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Clear date"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            )}
          />
        </Field>
      </Section>

      {/* ── Notes ── */}
      <Section icon={<StickyNote size={14} />} title="Notes" optional>
        <Field label="" error={errors.notes?.message}>
          <Textarea
            {...register('notes')}
            placeholder="Any additional notes…"
            className="rounded-xl border-input resize-none"
            rows={3}
          />
        </Field>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl h-10 font-medium gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Save Changes
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentManagementPage() {
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';
  const canManageAssignments =
    user?.role === 'admin' || user?.role === 'account_manager';
  const { data: assignments = [], isLoading } = useAllAssignmentsQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: atsVas = [] } = useAtsVAsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery();

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
      queryClient.invalidateQueries({ queryKey: QK.allAssignments });
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
  for (const c of atsClients) clientMap[c.id] = c.companyName;

  const vaMap: Record<string, string> = {};
  for (const v of atsVas) vaMap[v.id] = `${v.firstName} ${v.lastName}`;

  const amMap: Record<string, string> = {};
  for (const u of accountManagers) amMap[u.id] = `${u.firstName} ${u.lastName}`;

  const columns = buildColumns(
    clientMap,
    vaMap,
    amMap,
    a => {
      setEditTarget(a);
      setSheetMode('edit');
    },
    a => setDeactivateTarget(a),
    canManageAssignments,
    rolePrefix
  );

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
          />
        </div>
      </div>

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
              clients={atsClients}
              vas={atsVas}
              assignments={assignments}
              team={accountManagers}
              onSuccess={() => {
                setSheetMode(null);
                queryClient.invalidateQueries({ queryKey: QK.allAssignments });
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
                queryClient.invalidateQueries({ queryKey: QK.allAssignments });
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
