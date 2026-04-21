import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { PenLineIcon, PlusIcon, XIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  QK,
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsTeamQuery,
  useAtsVAsQuery,
} from '@/hooks/queries'
import {
  createAssignment,
  updateAssignment,
} from '@/services/assignments.service'
import type { IAssignment } from '@/types/assignment'
import type { IAtsCandidate, IAtsClient, IAtsUser } from '@/types/ats'
import { useQueryClient } from '@tanstack/react-query'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  clientId: z.string().min(1, 'Required'),
  vaId: z.string().min(1, 'Required'),
  accountManagerId: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  status: z.enum(['active', 'paused', 'ended']),
  serviceType: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})
type CreateFormData = z.infer<typeof createSchema>

const editSchema = z.object({
  accountManagerId: z.string().min(1, 'Required'),
  status: z.enum(['active', 'paused', 'ended']),
  serviceType: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildColumns(
  clientMap: Record<string, string>,
  vaMap: Record<string, string>,
  amMap: Record<string, string>,
  onEdit: (a: IAssignment) => void,
  onDeactivate: (a: IAssignment) => void
): ColumnDef<IAssignment>[] {
  return [
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 210,
      cell: ({ getValue }) =>
        clientMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'vaId',
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
        const v = getValue<string>()
        const styles =
          {
            active:
              'bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-green-500/20',
            paused:
              'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20',
            ended: 'bg-muted text-muted-foreground ring-1 ring-border',
          }[v] ?? 'bg-muted text-muted-foreground ring-1 ring-border'
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap ${styles}`}
          >
            {v}
          </span>
        )
      },
    },
    {
      accessorKey: 'serviceType',
      header: 'Service Type',
      cell: ({ getValue }) => getValue<string>() ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 whitespace-nowrap">
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
    },
  ]
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateAssignmentForm({
  clients,
  vas,
  team,
  onSuccess,
}: {
  clients: IAtsClient[]
  vas: IAtsCandidate[]
  team: IAtsUser[]
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'active' },
  })

  const [serverError, setServerError] = useState('')

  async function onSubmit(data: CreateFormData) {
    setServerError('')
    try {
      await createAssignment(data)
      toast.success('Assignment created.')
      onSuccess()
    } catch {
      setServerError('Failed to create assignment. Please try again.')
      toast.error('Failed to create assignment. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-4"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Field label="Client" error={errors.clientId?.message}>
        <Controller
          control={control}
          name="clientId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-xl border-input">
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

      <Field label="VA" error={errors.vaId?.message}>
        <Controller
          control={control}
          name="vaId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-xl border-input">
                <SelectValue placeholder="Select VA" />
              </SelectTrigger>
              <SelectContent>
                {vas.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.firstName} {v.lastName}
                  </SelectItem>
                ))}
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
              <SelectTrigger className="rounded-xl border-input">
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

      <Field label="Service Type" error={errors.serviceType?.message}>
        <Input
          {...register('serviceType')}
          placeholder="e.g. Medical VA, Admin Support"
          className="rounded-xl border-input"
        />
      </Field>

      <Field label="Start Date" error={errors.startDate?.message}>
        <Input
          type="date"
          {...register('startDate')}
          className="rounded-xl border-input"
        />
      </Field>

      <Field label="End Date (optional)" error={errors.endDate?.message}>
        <Input
          type="date"
          {...register('endDate')}
          className="rounded-xl border-input"
        />
      </Field>

      <Field label="Status" error={errors.status?.message}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-xl border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="Notes (optional)" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          placeholder="Any additional notes…"
          className="rounded-xl border-input"
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Creating…' : 'Create Assignment'}
      </Button>
    </form>
  )
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditAssignmentForm({
  assignment,
  team,
  onSuccess,
}: {
  assignment: IAssignment
  team: IAtsUser[]
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    reset({
      accountManagerId: assignment.accountManagerId ?? '',
      status: assignment.status,
      serviceType: assignment.serviceType ?? '',
      endDate: assignment.endDate ?? '',
      notes: assignment.notes ?? '',
    })
  }, [assignment, reset])

  async function onSubmit(data: EditFormData) {
    setServerError('')
    try {
      await updateAssignment(assignment.id, data)
      toast.success('Assignment updated.')
      onSuccess()
    } catch {
      setServerError('Failed to save changes. Please try again.')
      toast.error('Failed to save changes. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-4"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Field label="Account Manager" error={errors.accountManagerId?.message}>
        <Controller
          control={control}
          name="accountManagerId"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-xl border-input">
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

      <Field label="Status" error={errors.status?.message}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-xl border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="Service Type" error={errors.serviceType?.message}>
        <Input
          {...register('serviceType')}
          placeholder="e.g. Medical VA, Admin Support"
          className="rounded-xl border-input"
        />
      </Field>

      <Field label="End Date (optional)" error={errors.endDate?.message}>
        <Input
          type="date"
          {...register('endDate')}
          className="rounded-xl border-input"
        />
      </Field>

      <Field label="Notes (optional)" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          placeholder="Any additional notes…"
          className="rounded-xl border-input"
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentManagementPage() {
  const queryClient = useQueryClient()
  const { data: assignments = [], isLoading } = useAllAssignmentsQuery()
  const { data: atsClients = [] } = useAtsClientsQuery()
  const { data: atsVas = [] } = useAtsVAsQuery()
  const { data: atsTeam = [] } = useAtsTeamQuery()

  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<IAssignment | null>(null)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  async function handleDeactivate(a: IAssignment) {
    const confirmed = window.confirm(
      `Deactivate assignment for "${a.serviceType ?? a.id}"? This will end the active VA–client relationship.`
    )
    if (!confirmed) return
    setDeactivateError(null)
    try {
      await updateAssignment(a.id, { status: 'ended' })
      queryClient.invalidateQueries({ queryKey: QK.allAssignments })
      toast.success('Assignment deactivated.')
    } catch {
      setDeactivateError('Failed to deactivate assignment. Please try again.')
      toast.error('Failed to deactivate assignment. Please try again.')
    }
  }

  function handleSheetClose(open: boolean) {
    if (!open) setSheetMode(null)
  }

  const clientMap: Record<string, string> = {}
  for (const c of atsClients) clientMap[c.id] = c.companyName

  const vaMap: Record<string, string> = {}
  for (const v of atsVas) vaMap[v.id] = `${v.firstName} ${v.lastName}`

  const amMap: Record<string, string> = {}
  for (const u of atsTeam) amMap[u.id] = `${u.firstName} ${u.lastName}`

  const columns = buildColumns(
    clientMap,
    vaMap,
    amMap,
    a => {
      setEditTarget(a)
      setSheetMode('edit')
    },
    handleDeactivate
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Assignments
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage VA–client assignments
            </p>
          </div>
          <Button onClick={() => setSheetMode('create')}>
            <PlusIcon className="size-4" />
            New Assignment
          </Button>
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
              team={atsTeam}
              onSuccess={() => {
                setSheetMode(null)
                queryClient.invalidateQueries({ queryKey: QK.allAssignments })
              }}
            />
          )}

          {sheetMode === 'edit' && editTarget && (
            <EditAssignmentForm
              assignment={editTarget}
              team={atsTeam}
              onSuccess={() => {
                setSheetMode(null)
                queryClient.invalidateQueries({ queryKey: QK.allAssignments })
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
