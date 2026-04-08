import { useEffect, useState, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/DataTable'
import { getClientAccounts, updateClientAccount } from '@/services/client-accounts.service'
import { getVaProfiles, updateVaProfile } from '@/services/va-profiles.service'
import { getAtsClients, getAtsVAs } from '@/services/ats.service'
import type { IClientAccount } from '@/types/client-account'
import type { IVaProfile } from '@/types/va-profile'
import type { IAtsClient, IAtsCandidate } from '@/types/ats'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const clientAccountSchema = z.object({
  healthStatus:      z.enum(['green', 'yellow', 'red']),
  satisfactionScore: z.string().optional(),
  baaSigned:         z.boolean(),
  baaSignedDate:     z.string().optional(),
  onboardingComplete: z.boolean(),
  sopReceived:       z.boolean(),
  primaryContact:    z.string().optional(),
  secondaryContact:  z.string().optional(),
  lastClientCheckin: z.string().optional(),
  emrSystem:         z.string().optional(),
  openIssuesCount:   z.coerce.number().int().min(0),
  notes:             z.string().optional(),
})
type ClientAccountFormData = z.infer<typeof clientAccountSchema>

const vaProfileSchema = z.object({
  workloadLevel:      z.enum(['low', 'normal', 'high', 'overloaded']),
  satisfactionScore:  z.string().optional(),
  burnoutRiskFlag:    z.boolean(),
  replacementRiskFlag: z.boolean(),
  lastVaCheckin:      z.string().optional(),
  notes:              z.string().optional(),
})
type VaProfileFormData = z.infer<typeof vaProfileSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function HealthBadge({ status }: { status: string }) {
  const cls =
    status === 'green'  ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
    status === 'yellow' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                          'bg-red-500/10 text-red-600 dark:text-red-400'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

function WorkloadBadge({ level }: { level: string }) {
  const cls =
    level === 'low'       ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
    level === 'normal'    ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
    level === 'high'      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                            'bg-red-500/10 text-red-600 dark:text-red-400'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {level}
    </span>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium leading-none text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function CheckboxField({
  label, checked, onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        id={label}
      />
      <Label htmlFor={label} className="text-sm font-medium text-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

// ─── Client Account Edit Form ─────────────────────────────────────────────────

function EditClientAccountForm({
  account, onSuccess,
}: {
  account: IClientAccount
  onSuccess: () => void
}) {
  const {
    register, handleSubmit, control, reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientAccountFormData>({ resolver: zodResolver(clientAccountSchema) })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    reset({
      healthStatus:      account.healthStatus,
      satisfactionScore: account.satisfactionScore?.toString() ?? '',
      baaSigned:         account.baaSigned,
      baaSignedDate:     account.baaSignedDate?.slice(0, 10) ?? '',
      onboardingComplete: account.onboardingComplete,
      sopReceived:       account.sopReceived,
      primaryContact:    account.primaryContact ?? '',
      secondaryContact:  account.secondaryContact ?? '',
      lastClientCheckin: account.lastClientCheckin?.slice(0, 10) ?? '',
      emrSystem:         account.emrSystem ?? '',
      openIssuesCount:   account.openIssuesCount,
      notes:             account.notes ?? '',
    })
  }, [account, reset])

  async function onSubmit(data: ClientAccountFormData) {
    setServerError('')
    try {
      await updateClientAccount(account.clientId, {
        ...data,
        satisfactionScore: data.satisfactionScore ? parseInt(data.satisfactionScore, 10) : undefined,
      })
      onSuccess()
    } catch {
      setServerError('Failed to save changes. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-7 pb-6">
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
      )}

      <Field label="Health Status" error={errors.healthStatus?.message}>
        <Controller
          control={control}
          name="healthStatus"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">Green — Healthy</SelectItem>
                <SelectItem value="yellow">Yellow — Attention needed</SelectItem>
                <SelectItem value="red">Red — At risk</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="Satisfaction Score (1–5)" error={errors.satisfactionScore?.message}>
        <Controller
          control={control}
          name="satisfactionScore"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4', '5'].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Controller
        control={control}
        name="baaSigned"
        render={({ field }) => (
          <CheckboxField label="BAA Signed" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />

      <Field label="BAA Signed Date" error={errors.baaSignedDate?.message}>
        <Input type="date" {...register('baaSignedDate')} className="rounded-md border-input" />
      </Field>

      <Controller
        control={control}
        name="onboardingComplete"
        render={({ field }) => (
          <CheckboxField label="Onboarding Complete" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />

      <Controller
        control={control}
        name="sopReceived"
        render={({ field }) => (
          <CheckboxField label="SOP Received" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />

      <Field label="EMR System" error={errors.emrSystem?.message}>
        <Input {...register('emrSystem')} placeholder="e.g. Epic, Athena" className="rounded-md border-input" />
      </Field>

      <Field label="Primary Contact" error={errors.primaryContact?.message}>
        <Input {...register('primaryContact')} placeholder="Name or email" className="rounded-md border-input" />
      </Field>

      <Field label="Secondary Contact" error={errors.secondaryContact?.message}>
        <Input {...register('secondaryContact')} placeholder="Name or email" className="rounded-md border-input" />
      </Field>

      <Field label="Last Client Check-in" error={errors.lastClientCheckin?.message}>
        <Input type="date" {...register('lastClientCheckin')} className="rounded-md border-input" />
      </Field>

      <Field label="Open Issues Count" error={errors.openIssuesCount?.message}>
        <Input type="number" min="0" {...register('openIssuesCount')} className="rounded-md border-input" />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Internal notes…" className="rounded-md border-input" />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}

// ─── VA Profile Edit Form ─────────────────────────────────────────────────────

function EditVaProfileForm({
  profile, onSuccess,
}: {
  profile: IVaProfile
  onSuccess: () => void
}) {
  const {
    register, handleSubmit, control, reset,
    formState: { errors, isSubmitting },
  } = useForm<VaProfileFormData>({ resolver: zodResolver(vaProfileSchema) })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    reset({
      workloadLevel:      profile.workloadLevel,
      satisfactionScore:  profile.satisfactionScore?.toString() ?? '',
      burnoutRiskFlag:    profile.burnoutRiskFlag,
      replacementRiskFlag: profile.replacementRiskFlag,
      lastVaCheckin:      profile.lastVaCheckin?.slice(0, 10) ?? '',
      notes:              profile.notes ?? '',
    })
  }, [profile, reset])

  async function onSubmit(data: VaProfileFormData) {
    setServerError('')
    try {
      await updateVaProfile(profile.vaId, {
        ...data,
        satisfactionScore: data.satisfactionScore ? parseInt(data.satisfactionScore, 10) : undefined,
      })
      onSuccess()
    } catch {
      setServerError('Failed to save changes. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-7 pb-6">
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
      )}

      <Field label="Workload Level" error={errors.workloadLevel?.message}>
        <Controller
          control={control}
          name="workloadLevel"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="overloaded">Overloaded</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="Satisfaction Score (1–5)" error={errors.satisfactionScore?.message}>
        <Controller
          control={control}
          name="satisfactionScore"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4', '5'].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Controller
        control={control}
        name="burnoutRiskFlag"
        render={({ field }) => (
          <CheckboxField label="Burnout Risk" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />

      <Controller
        control={control}
        name="replacementRiskFlag"
        render={({ field }) => (
          <CheckboxField label="Replacement Risk" checked={field.value} onCheckedChange={field.onChange} />
        )}
      />

      <Field label="Last VA Check-in" error={errors.lastVaCheckin?.message}>
        <Input type="date" {...register('lastVaCheckin')} className="rounded-md border-input" />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} placeholder="Internal notes…" className="rounded-md border-input" />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState<IClientAccount[]>([])
  const [profiles, setProfiles] = useState<IVaProfile[]>([])
  const [atsClients, setAtsClients] = useState<IAtsClient[]>([])
  const [atsVas, setAtsVas] = useState<IAtsCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [editAccount, setEditAccount] = useState<IClientAccount | null>(null)
  const [editProfile, setEditProfile] = useState<IVaProfile | null>(null)

  async function reload() {
    const [a, p] = await Promise.all([getClientAccounts(), getVaProfiles()])
    setAccounts(a)
    setProfiles(p)
  }

  useEffect(() => {
    async function init() {
      try {
        const [a, p, clients, vas] = await Promise.all([
          getClientAccounts(),
          getVaProfiles(),
          getAtsClients(),
          getAtsVAs(),
        ])
        setAccounts(a)
        setProfiles(p)
        setAtsClients(clients)
        setAtsVas(vas)
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

  // ── Client Accounts columns ──────────────────────────────────────────────
  const accountColumns: ColumnDef<IClientAccount>[] = [
    {
      accessorKey: 'clientId',
      header: 'Company',
      cell: ({ getValue }) => clientMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'healthStatus',
      header: 'Health',
      cell: ({ getValue }) => <HealthBadge status={getValue<string>()} />,
    },
    {
      accessorKey: 'baaSigned',
      header: 'BAA',
      cell: ({ getValue }) => getValue<boolean>() ? '✓' : '—',
      enableSorting: false,
    },
    {
      accessorKey: 'onboardingComplete',
      header: 'Onboarding',
      cell: ({ getValue }) => getValue<boolean>() ? '✓' : '—',
      enableSorting: false,
    },
    {
      accessorKey: 'openIssuesCount',
      header: 'Open Issues',
    },
    {
      accessorKey: 'lastClientCheckin',
      header: 'Last Check-in',
      cell: ({ getValue }) => getValue<string>()?.slice(0, 10) ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setEditAccount(row.original)}
          className="text-xs text-blue-600 hover:underline"
        >
          Edit
        </button>
      ),
    },
  ]

  // ── VA Profile columns ───────────────────────────────────────────────────
  const profileColumns: ColumnDef<IVaProfile>[] = [
    {
      accessorKey: 'vaId',
      header: 'VA',
      cell: ({ getValue }) => vaMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'workloadLevel',
      header: 'Workload',
      cell: ({ getValue }) => <WorkloadBadge level={getValue<string>()} />,
    },
    {
      accessorKey: 'satisfactionScore',
      header: 'Satisfaction',
      cell: ({ getValue }) => getValue<number | undefined>() ?? '—',
    },
    {
      accessorKey: 'burnoutRiskFlag',
      header: 'Burnout Risk',
      cell: ({ getValue }) => getValue<boolean>() ? '🔴' : '—',
      enableSorting: false,
    },
    {
      accessorKey: 'replacementRiskFlag',
      header: 'Replacement Risk',
      cell: ({ getValue }) => getValue<boolean>() ? '🔴' : '—',
      enableSorting: false,
    },
    {
      accessorKey: 'lastVaCheckin',
      header: 'Last Check-in',
      cell: ({ getValue }) => getValue<string>()?.slice(0, 10) ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setEditProfile(row.original)}
          className="text-xs text-blue-600 hover:underline"
        >
          Edit
        </button>
      ),
    },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        <div className="px-4 lg:px-6">
          <h1 className="text-xl font-semibold text-foreground">Account Management</h1>
          <p className="text-sm text-muted-foreground">Client accounts and VA operational profiles</p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="client-accounts">
            <TabsList>
              <TabsTrigger value="client-accounts">Client Accounts</TabsTrigger>
              <TabsTrigger value="va-profiles">VA Profiles</TabsTrigger>
            </TabsList>

            <TabsContent value="client-accounts" className="mt-4">
              <DataTable columns={accountColumns} data={accounts} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="va-profiles" className="mt-4">
              <DataTable columns={profileColumns} data={profiles} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>

      </div>

      {/* Client Account Edit Sheet */}
      <Sheet open={editAccount !== null} onOpenChange={(o) => !o && setEditAccount(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Client Account</SheetTitle>
            <SheetDescription>
              {editAccount ? clientMap[editAccount.clientId] ?? editAccount.clientId : ''}
            </SheetDescription>
          </SheetHeader>
          {editAccount && (
            <EditClientAccountForm
              account={editAccount}
              onSuccess={async () => {
                setEditAccount(null)
                await reload()
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* VA Profile Edit Sheet */}
      <Sheet open={editProfile !== null} onOpenChange={(o) => !o && setEditProfile(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit VA Profile</SheetTitle>
            <SheetDescription>
              {editProfile ? vaMap[editProfile.vaId] ?? editProfile.vaId : ''}
            </SheetDescription>
          </SheetHeader>
          {editProfile && (
            <EditVaProfileForm
              profile={editProfile}
              onSuccess={async () => {
                setEditProfile(null)
                await reload()
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
