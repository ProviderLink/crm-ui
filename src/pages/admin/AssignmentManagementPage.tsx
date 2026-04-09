import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
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
  createAssignment,
  getAllAssignments,
  updateAssignment,
} from '@/services/assignments.service'
import { getAtsClients, getAtsTeam, getAtsVAs } from '@/services/ats.service'
import type { IAssignment } from '@/types/assignment'
import type { IAtsCandidate, IAtsClient, IAtsUser } from '@/types/ats'

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
      accessorKey: 'client_id',
      header: 'Client',
      cell: ({ getValue }) =>
        clientMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'va_id',
      header: 'VA',
      cell: ({ getValue }) => vaMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'account_manager_id',
      header: 'Account Manager',
      cell: ({ getValue }) => amMap[getValue<string>() ?? ''] ?? '—',
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ getValue }) => getValue<string>()?.slice(0, 10) ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue<string>()
        const cls =
          v === 'active'
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : v === 'paused'
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
              : 'bg-muted text-muted-foreground'
        return (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
          >
            {v}
          </span>
        )
      },
    },
    {
      accessorKey: 'service_type',
      header: 'Service Type',
      cell: ({ getValue }) => getValue<string>() ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit
          </button>
          {row.original.status !== 'ended' && (
            <button
              type="button"
              onClick={() => onDeactivate(row.original)}
              className="text-xs text-destructive hover:underline"
            >
              Deactivate
            </button>
          )}
        </div>
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
      onSuccess()
    } catch {
      setServerError('Failed to create assignment. Please try again.')
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
      accountManagerId: assignment.account_manager_id ?? '',
      status: assignment.status,
      serviceType: assignment.service_type ?? '',
      endDate: assignment.end_date ?? '',
      notes: assignment.notes ?? '',
    })
  }, [assignment, reset])

  async function onSubmit(data: EditFormData) {
    setServerError('')
    try {
      await updateAssignment(assignment.id, data)
      onSuccess()
    } catch {
      setServerError('Failed to save changes. Please try again.')
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
  const [assignments, setAssignments] = useState<IAssignment[]>([])
  const [atsClients, setAtsClients] = useState<IAtsClient[]>([])
  const [atsVas, setAtsVas] = useState<IAtsCandidate[]>([])
  const [atsTeam, setAtsTeam] = useState<IAtsUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<IAssignment | null>(null)

  async function loadAssignments() {
    const data = await getAllAssignments()
    setAssignments(data)
  }

  useEffect(() => {
    async function init() {
      try {
        const [allAssignments, clients, vas, team] = await Promise.all([
          getAllAssignments(),
          getAtsClients(),
          getAtsVAs(),
          getAtsTeam(),
        ])
        setAssignments(allAssignments)
        setAtsClients(clients)
        setAtsVas(vas)
        setAtsTeam(team)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    void init()
  }, [])

  const clientMap: Record<string, string> = {}
  for (const c of atsClients) clientMap[c.id] = c.companyName

  const vaMap: Record<string, string> = {}
  for (const v of atsVas) vaMap[v.id] = `${v.firstName} ${v.lastName}`

  const amMap: Record<string, string> = {}
  for (const u of atsTeam) amMap[u.id] = `${u.firstName} ${u.lastName}`

  async function handleDeactivate(a: IAssignment) {
    try {
      await updateAssignment(a.id, { status: 'ended' })
      await loadAssignments()
    } catch {
      // silently fail
    }
  }

  function handleSheetClose(open: boolean) {
    if (!open) setSheetMode(null)
  }

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
              onSuccess={async () => {
                setSheetMode(null)
                await loadAssignments()
              }}
            />
          )}

          {sheetMode === 'edit' && editTarget && (
            <EditAssignmentForm
              assignment={editTarget}
              team={atsTeam}
              onSuccess={async () => {
                setSheetMode(null)
                await loadAssignments()
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
