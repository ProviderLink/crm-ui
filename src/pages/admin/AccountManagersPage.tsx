import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  AlertCircle,
  KeyRoundIcon,
  PenLineIcon,
  PlusIcon,
  ShieldOffIcon,
  UserCogIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QK, useAccountManagersQuery } from '@/hooks/queries'
import {
  createAccountManager,
  deactivateAccountManager,
  resetAccountManagerPassword,
  updateAccountManager,
  type IAccountManager,
} from '@/services/account-managers.service'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  atsId: z.string().optional(),
})
type CreateFormData = z.infer<typeof createSchema>

const editSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  atsId: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function buildColumns(
  onEdit: (am: IAccountManager) => void,
  onDeactivate: (am: IAccountManager) => void,
  onResetPassword: (am: IAccountManager) => void
): ColumnDef<IAccountManager>[] {
  return [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => {
        const am = row.original
        return (
          <div>
            <p className="font-medium text-sm">
              {am.firstName} {am.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{am.email}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string) || '—'}</span>
      ),
    },
    {
      accessorKey: 'atsId',
      header: 'ATS Link',
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined
        return val ? (
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
            {val}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Not linked
          </span>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50 text-xs"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 bg-red-50 text-xs"
          >
            Inactive
          </Badge>
        ),
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined
        return (
          <span className="text-sm text-muted-foreground">
            {v ? new Date(v).toLocaleDateString() : '—'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const am = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center gap-1 justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(am)}
                  >
                    <PenLineIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onResetPassword(am)}
                  >
                    <KeyRoundIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Password</TooltipContent>
              </Tooltip>

              {am.isActive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => onDeactivate(am)}
                    >
                      <ShieldOffIcon size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Deactivate</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )
      },
    },
  ]
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateACMForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void
  onClose: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) })

  const [serverError, setServerError] = useState('')

  async function onSubmit(data: CreateFormData) {
    setServerError('')
    try {
      await createAccountManager({ ...data, role: 'account_manager' })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error
      setServerError(msg ?? 'Failed to create account. Please try again.')
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

      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" error={errors.firstName?.message}>
          <Input
            {...register('firstName')}
            placeholder="Jane"
            className="rounded-xl border-input h-10"
          />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <Input
            {...register('lastName')}
            placeholder="Doe"
            className="rounded-xl border-input h-10"
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input
          {...register('email')}
          type="email"
          placeholder="jane@example.com"
          className="rounded-xl border-input h-10"
        />
      </Field>

      <Field label="Phone" error={errors.phone?.message}>
        <Input
          {...register('phone')}
          placeholder="+1 555 000 0000"
          className="rounded-xl border-input h-10"
        />
      </Field>

      <Field
        label="ATS ID (optional)"
        error={errors.atsId?.message}
        hint="Link this ACM to their ATS user record by ID"
      >
        <Input
          {...register('atsId')}
          placeholder="ATS user ID"
          className="rounded-xl border-input h-10 font-mono text-sm"
        />
      </Field>

      <p className="text-xs text-muted-foreground rounded-xl bg-muted px-4 py-3">
        A temporary password will be auto-generated and emailed to this account
        manager.
      </p>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
        >
          Cancel
        </button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? 'Creating…' : 'Create Account Manager'}
        </Button>
      </div>
    </form>
  )
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditACMForm({
  am,
  onSuccess,
  onClose,
}: {
  am: IAccountManager
  onSuccess: () => void
  onClose: () => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    reset({
      firstName: am.firstName,
      lastName: am.lastName,
      phone: am.phone ?? '',
      atsId: am.atsId ?? '',
    })
  }, [am, reset])

  async function onSubmit(data: EditFormData) {
    setServerError('')
    try {
      await updateAccountManager(am.id, data)
      onSuccess()
    } catch {
      setServerError('Failed to save changes. Please try again.')
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

      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" error={errors.firstName?.message}>
          <Input
            {...register('firstName')}
            className="rounded-xl border-input h-10"
          />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <Input
            {...register('lastName')}
            className="rounded-xl border-input h-10"
          />
        </Field>
      </div>

      <Field label="Phone" error={errors.phone?.message}>
        <Input
          {...register('phone')}
          placeholder="+1 555 000 0000"
          className="rounded-xl border-input h-10"
        />
      </Field>

      <Field
        label="ATS ID"
        error={errors.atsId?.message}
        hint="Link to ATS user record"
      >
        <Input
          {...register('atsId')}
          placeholder="ATS user ID"
          className="rounded-xl border-input h-10 font-mono text-sm"
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
        >
          Cancel
        </button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SheetMode = 'create' | 'edit' | null

export default function AccountManagersPage() {
  const queryClient = useQueryClient()
  const { data: accountManagers = [], isLoading } = useAccountManagersQuery()

  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [editTarget, setEditTarget] = useState<IAccountManager | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<IAccountManager | null>(null)
  const [resetPwTarget, setResetPwTarget] = useState<IAccountManager | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QK.accountManagers })
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return
    setActionError(null)
    try {
      await deactivateAccountManager(deactivateTarget.id)
      invalidate()
    } catch {
      setActionError('Failed to deactivate account. Please try again.')
    } finally {
      setDeactivateTarget(null)
    }
  }

  async function confirmResetPassword() {
    if (!resetPwTarget) return
    setActionError(null)
    try {
      await resetAccountManagerPassword(resetPwTarget.id)
      invalidate()
    } catch {
      setActionError('Failed to reset password. Please try again.')
    } finally {
      setResetPwTarget(null)
    }
  }

  const columns = buildColumns(
    am => {
      setEditTarget(am)
      setSheetMode('edit')
    },
    am => setDeactivateTarget(am),
    am => setResetPwTarget(am)
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <UserCogIcon size={20} />
              Account Managers
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage CRM account manager accounts
            </p>
          </div>
          <Button onClick={() => setSheetMode('create')}>
            <PlusIcon className="size-4" />
            New Account Manager
          </Button>
        </div>

        {/* Table */}
        <div className="px-4 lg:px-6">
          {actionError && (
            <p className="mb-2 text-sm text-destructive">{actionError}</p>
          )}
          <DataTable
            columns={columns}
            data={accountManagers}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Sheet */}
      <Sheet
        open={sheetMode !== null}
        onOpenChange={open => {
          if (!open) setSheetMode(null)
        }}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === 'create'
                ? 'New Account Manager'
                : 'Edit Account Manager'}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === 'create'
                ? 'Create a CRM login for an account manager. Credentials will be emailed automatically.'
                : 'Update account manager details.'}
            </SheetDescription>
          </SheetHeader>

          {sheetMode === 'create' && (
            <CreateACMForm
              onSuccess={() => {
                setSheetMode(null)
                invalidate()
              }}
              onClose={() => setSheetMode(null)}
            />
          )}

          {sheetMode === 'edit' && editTarget && (
            <EditACMForm
              am={editTarget}
              onSuccess={() => {
                setSheetMode(null)
                invalidate()
              }}
              onClose={() => setSheetMode(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate Account"
        description={
          deactivateTarget
            ? `Deactivate account for ${deactivateTarget.firstName} ${deactivateTarget.lastName}? They will no longer be able to log in.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {/* Reset password confirmation */}
      <ConfirmDialog
        open={resetPwTarget !== null}
        title="Reset Password"
        description={
          resetPwTarget
            ? `Reset password for ${resetPwTarget.firstName} ${resetPwTarget.lastName}? A new temporary password will be emailed to them.`
            : ''
        }
        confirmLabel="Reset Password"
        variant="default"
        onConfirm={confirmResetPassword}
        onCancel={() => setResetPwTarget(null)}
      />
    </div>
  )
}
