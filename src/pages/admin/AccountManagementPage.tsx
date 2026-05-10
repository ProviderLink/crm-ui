import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import {
  EyeIcon,
  KeyRoundIcon,
  PenLineIcon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  QK,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useClientAccountsQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
  useVaProfilesQuery,
} from '@/hooks/queries';
import {
  createCrmUser,
  deactivateCrmUser,
  resetCrmUserPassword,
  type ICrmUser,
} from '@/services/account-managers.service';
import { updateClientAccount } from '@/services/client-accounts.service';
import { updateVaProfile } from '@/services/va-profiles.service';
import type { IAtsCandidate, IAtsClient } from '@/types/ats';
import type { IClientAccount } from '@/types/client-account';
import type { IVaProfile } from '@/types/va-profile';
import { useQueryClient } from '@tanstack/react-query';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const clientAccountSchema = z.object({
  healthStatus: z.enum(['green', 'yellow', 'red']),
  satisfactionScore: z.string().optional(),
  baaSigned: z.boolean(),
  baaSignedDate: z.string().optional(),
  onboardingComplete: z.boolean(),
  sopReceived: z.boolean(),
  primaryContact: z.string().optional(),
  secondaryContact: z.string().optional(),
  lastClientCheckin: z.string().optional(),
  emrSystem: z.string().optional(),
  openIssuesCount: z.number().int().min(0),
  notes: z.string().optional(),
});
type ClientAccountFormData = z.infer<typeof clientAccountSchema>;

const vaProfileSchema = z.object({
  workloadLevel: z.enum(['low', 'normal', 'high', 'overloaded']),
  satisfactionScore: z.string().optional(),
  burnoutRiskFlag: z.boolean(),
  replacementRiskFlag: z.boolean(),
  lastVaCheckin: z.string().optional(),
  notes: z.string().optional(),
});
type VaProfileFormData = z.infer<typeof vaProfileSchema>;

const provisionLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
});
type ProvisionLoginFormData = z.infer<typeof provisionLoginSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoginStatusBadge({ user }: { user: ICrmUser | undefined }) {
  if (!user) {
    return (
      <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        Not provisioned
      </span>
    );
  }
  if (!user.isActive) {
    return (
      <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        Deactivated
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
      Active
    </span>
  );
}

function HealthBadge({ status }: { status: string }) {
  const cls =
    status === 'green'
      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
      : status === 'yellow'
        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
        : 'bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function WorkloadBadge({ level }: { level: string }) {
  const cls =
    level === 'low'
      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      : level === 'normal'
        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
        : level === 'high'
          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {level}
    </span>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium leading-none text-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const id = `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        onCheckedChange={v => onCheckedChange(v === true)}
        id={id}
      />
      <Label
        htmlFor={id}
        className="text-sm font-medium text-foreground cursor-pointer"
      >
        {label}
      </Label>
    </div>
  );
}

// ─── Provision Login Form ─────────────────────────────────────────────────────

function ProvisionLoginForm({
  role,
  atsId,
  defaultFirstName,
  defaultLastName,
  onSuccess,
}: {
  role: 'va' | 'client';
  atsId: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProvisionLoginFormData>({
    resolver: zodResolver(provisionLoginSchema),
    defaultValues: {
      firstName: defaultFirstName ?? '',
      lastName: defaultLastName ?? '',
    },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: ProvisionLoginFormData) {
    setServerError('');
    try {
      await createCrmUser({ ...data, role, atsId });
      toast.success('Login provisioned — credentials emailed.');
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to provision login.';
      setServerError(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-5 pb-6"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        A temporary password will be auto-generated and emailed to the user.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>Email *</Label>
        <Input
          {...register('email')}
          type="email"
          placeholder="user@example.com"
          className="rounded-md border-input"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label>First Name *</Label>
          <Input
            {...register('firstName')}
            placeholder="First"
            className="rounded-md border-input"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <Label>Last Name *</Label>
          <Input
            {...register('lastName')}
            placeholder="Last"
            className="rounded-md border-input"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Phone</Label>
        <Input
          {...register('phone')}
          placeholder="+1 555 000 0000"
          className="rounded-md border-input"
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Provisioning…' : 'Provision Login'}
      </Button>
    </form>
  );
}

// ─── Client Account Edit Form ─────────────────────────────────────────────────

function EditClientAccountForm({
  account,
  onSuccess,
}: {
  account: IClientAccount;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientAccountFormData>({
    resolver: zodResolver(clientAccountSchema),
  });

  const [serverError, setServerError] = useState('');

  useEffect(() => {
    reset({
      healthStatus: account.healthStatus,
      satisfactionScore: account.satisfactionScore?.toString() ?? '',
      baaSigned: account.baaSigned,
      baaSignedDate: account.baaSignedDate?.slice(0, 10) ?? '',
      onboardingComplete: account.onboardingComplete,
      sopReceived: account.sopReceived,
      primaryContact: account.primaryContact ?? '',
      secondaryContact: account.secondaryContact ?? '',
      lastClientCheckin: account.lastClientCheckin?.slice(0, 10) ?? '',
      emrSystem: account.emrSystem ?? '',
      openIssuesCount: account.openIssuesCount,
      notes: account.notes ?? '',
    });
  }, [account, reset]);

  async function onSubmit(data: ClientAccountFormData) {
    setServerError('');
    try {
      await updateClientAccount(account.clientId, {
        ...data,
        satisfactionScore: data.satisfactionScore
          ? parseInt(data.satisfactionScore, 10)
          : undefined,
      });
      onSuccess();
    } catch {
      setServerError('Failed to save changes. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-7 pb-6"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
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
                <SelectItem value="yellow">
                  Yellow — Attention needed
                </SelectItem>
                <SelectItem value="red">Red — At risk</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field
        label="Satisfaction Score (1–5)"
        error={errors.satisfactionScore?.message}
      >
        <Controller
          control={control}
          name="satisfactionScore"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4', '5'].map(v => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
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
          <CheckboxField
            label="BAA Signed"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <Field label="BAA Signed Date" error={errors.baaSignedDate?.message}>
        <Controller
          name="baaSignedDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Controller
        control={control}
        name="onboardingComplete"
        render={({ field }) => (
          <CheckboxField
            label="Onboarding Complete"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="sopReceived"
        render={({ field }) => (
          <CheckboxField
            label="SOP Received"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <Field label="EMR System" error={errors.emrSystem?.message}>
        <Input
          {...register('emrSystem')}
          placeholder="e.g. Epic, Athena"
          className="rounded-md border-input"
        />
      </Field>

      <Field label="Primary Contact" error={errors.primaryContact?.message}>
        <Input
          {...register('primaryContact')}
          placeholder="Name or email"
          className="rounded-md border-input"
        />
      </Field>

      <Field label="Secondary Contact" error={errors.secondaryContact?.message}>
        <Input
          {...register('secondaryContact')}
          placeholder="Name or email"
          className="rounded-md border-input"
        />
      </Field>

      <Field
        label="Last Client Check-in"
        error={errors.lastClientCheckin?.message}
      >
        <Controller
          name="lastClientCheckin"
          control={control}
          render={({ field }) => (
            <DatePickerField
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="Open Issues Count" error={errors.openIssuesCount?.message}>
        <Input
          type="number"
          min="0"
          {...register('openIssuesCount', { valueAsNumber: true })}
          className="rounded-md border-input"
        />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          placeholder="Internal notes…"
          className="rounded-md border-input"
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}

// ─── VA Profile Edit Form ─────────────────────────────────────────────────────

function EditVaProfileForm({
  profile,
  onSuccess,
}: {
  profile: IVaProfile;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VaProfileFormData>({ resolver: zodResolver(vaProfileSchema) });

  const [serverError, setServerError] = useState('');

  useEffect(() => {
    reset({
      workloadLevel: profile.workloadLevel,
      satisfactionScore: profile.satisfactionScore?.toString() ?? '',
      burnoutRiskFlag: profile.burnoutRiskFlag,
      replacementRiskFlag: profile.replacementRiskFlag,
      lastVaCheckin: profile.lastVaCheckin?.slice(0, 10) ?? '',
      notes: profile.notes ?? '',
    });
  }, [profile, reset]);

  async function onSubmit(data: VaProfileFormData) {
    setServerError('');
    try {
      await updateVaProfile(profile.vaId, {
        ...data,
        satisfactionScore: data.satisfactionScore
          ? parseInt(data.satisfactionScore, 10)
          : undefined,
      });
      onSuccess();
    } catch {
      setServerError('Failed to save changes. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-7 pb-6"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
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

      <Field
        label="Satisfaction Score (1–5)"
        error={errors.satisfactionScore?.message}
      >
        <Controller
          control={control}
          name="satisfactionScore"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4', '5'].map(v => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
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
          <CheckboxField
            label="Burnout Risk"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="replacementRiskFlag"
        render={({ field }) => (
          <CheckboxField
            label="Replacement Risk"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <Field label="Last VA Check-in" error={errors.lastVaCheckin?.message}>
        <Controller
          name="lastVaCheckin"
          control={control}
          render={({ field }) => (
            <DatePickerField
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          placeholder="Internal notes…"
          className="rounded-md border-input"
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: loadingAccounts } =
    useClientAccountsQuery();
  const { data: profiles = [], isLoading: loadingProfiles } =
    useVaProfilesQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: atsVas = [] } = useAtsVAsQuery();
  const { data: crmVaUsers = [] } = useCrmVaUsersQuery();
  const { data: crmClientUsers = [] } = useCrmClientUsersQuery();
  const isLoading = loadingAccounts || loadingProfiles;

  const [editAccount, setEditAccount] = useState<IClientAccount | null>(null);
  const [editProfile, setEditProfile] = useState<IVaProfile | null>(null);
  const [viewAccount, setViewAccount] = useState<IClientAccount | null>(null);
  const [viewProfile, setViewProfile] = useState<IVaProfile | null>(null);

  // Provision login sheet state
  type ProvisionTarget = {
    role: 'va' | 'client';
    atsId: string;
    firstName?: string;
    lastName?: string;
    label: string;
  };
  const [provisionTarget, setProvisionTarget] =
    useState<ProvisionTarget | null>(null);

  // Confirm dialog state for CRM user actions
  type CrmConfirmAction = { type: 'resetPw' | 'deactivate'; user: ICrmUser };
  const [crmConfirm, setCrmConfirm] = useState<CrmConfirmAction | null>(null);

  async function executeCrmConfirm() {
    if (!crmConfirm) return;
    const { type, user } = crmConfirm;
    setCrmConfirm(null);
    if (type === 'resetPw') {
      try {
        await resetCrmUserPassword(user.id);
        toast.success('Password reset — new credentials emailed.');
      } catch {
        toast.error('Failed to reset password.');
      }
    } else {
      try {
        await deactivateCrmUser(user.id);
        toast.success('Login deactivated.');
        invalidateCrmUsers();
      } catch {
        toast.error('Failed to deactivate login.');
      }
    }
  }

  const clientMap: Record<string, IAtsClient> = {};
  for (const c of atsClients) clientMap[c.id] = c;

  const vaMap: Record<string, IAtsCandidate> = {};
  for (const v of atsVas) vaMap[v.id] = v;

  // Build atsId → CRM user maps for login status
  const crmClientMap: Record<string, ICrmUser> = {};
  for (const u of crmClientUsers) if (u.atsId) crmClientMap[u.atsId] = u;

  const crmVaMap: Record<string, ICrmUser> = {};
  for (const u of crmVaUsers) if (u.atsId) crmVaMap[u.atsId] = u;

  function invalidateCrmUsers() {
    queryClient.invalidateQueries({ queryKey: QK.crmClientUsers });
    queryClient.invalidateQueries({ queryKey: QK.crmVaUsers });
  }

  function ActionButtons({
    crmUser,
    onProvision,
    onResetPassword,
    onDeactivate,
  }: {
    crmUser: ICrmUser | undefined;
    onProvision: () => void;
    onResetPassword: (u: ICrmUser) => void;
    onDeactivate: (u: ICrmUser) => void;
  }) {
    async function handleResetPassword() {
      if (!crmUser) return;
      onResetPassword(crmUser);
    }
    async function handleDeactivate() {
      if (!crmUser) return;
      onDeactivate(crmUser);
    }

    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          {!crmUser ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  onClick={onProvision}
                >
                  <UserPlusIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Provision Login</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                    onClick={handleResetPassword}
                    disabled={!crmUser.isActive}
                  >
                    <KeyRoundIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Reset Password</TooltipContent>
              </Tooltip>
              {crmUser.isActive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 bg-white/[0.02] text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDeactivate}
                    >
                      <XCircleIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Deactivate Login</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // ── Client Accounts columns ──────────────────────────────────────────────
  const accountColumns: ColumnDef<IClientAccount>[] = [
    {
      accessorKey: 'clientId',
      header: 'Company',
      cell: ({ getValue }) =>
        clientMap[getValue<string>()]?.companyName ?? getValue<string>(),
    },
    {
      accessorKey: 'healthStatus',
      header: 'Health',
      size: 90,
      cell: ({ getValue }) => <HealthBadge status={getValue<string>()} />,
    },
    {
      accessorKey: 'baaSigned',
      header: 'BAA',
      size: 60,
      cell: ({ getValue }) => (getValue<boolean>() ? '✓' : '—'),
      enableSorting: false,
    },
    {
      id: 'crmLogin',
      header: 'CRM Login',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <LoginStatusBadge user={crmClientMap[row.original.clientId]} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { headerClassName: 'text-center' },
      enableSorting: false,
      size: 110,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  onClick={() => setViewAccount(row.original)}
                >
                  <EyeIcon className="size-3.5" />
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
                  onClick={() => setEditAccount(row.original)}
                >
                  <PenLineIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ActionButtons
            crmUser={crmClientMap[row.original.clientId]}
            onProvision={() =>
              setProvisionTarget({
                role: 'client',
                atsId: row.original.clientId,
                label:
                  clientMap[row.original.clientId]?.companyName ??
                  row.original.clientId,
              })
            }
            onResetPassword={u => setCrmConfirm({ type: 'resetPw', user: u })}
            onDeactivate={u => setCrmConfirm({ type: 'deactivate', user: u })}
          />
        </div>
      ),
    },
  ];

  // ── VA Profile columns ───────────────────────────────────────────────────
  const profileColumns: ColumnDef<IVaProfile>[] = [
    {
      accessorKey: 'vaId',
      header: 'VA',
      cell: ({ getValue }) => {
        const v = vaMap[getValue<string>()];
        return v ? `${v.firstName} ${v.lastName}` : getValue<string>();
      },
    },
    {
      accessorKey: 'workloadLevel',
      header: 'Workload',
      size: 110,
      cell: ({ getValue }) => <WorkloadBadge level={getValue<string>()} />,
    },
    {
      accessorKey: 'burnoutRiskFlag',
      header: 'Burnout',
      size: 80,
      cell: ({ getValue }) => (getValue<boolean>() ? '🔴' : '—'),
      enableSorting: false,
    },
    {
      id: 'crmLogin',
      header: 'CRM Login',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <LoginStatusBadge user={crmVaMap[row.original.vaId]} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { headerClassName: 'text-center' },
      enableSorting: false,
      size: 110,
      cell: ({ row }) => {
        const va = vaMap[row.original.vaId];
        return (
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                    onClick={() => setViewProfile(row.original)}
                  >
                    <EyeIcon className="size-3.5" />
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
                    onClick={() => setEditProfile(row.original)}
                  >
                    <PenLineIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ActionButtons
              crmUser={crmVaMap[row.original.vaId]}
              onProvision={() =>
                setProvisionTarget({
                  role: 'va',
                  atsId: row.original.vaId,
                  firstName: va?.firstName,
                  lastName: va?.lastName,
                  label: va
                    ? `${va.firstName} ${va.lastName}`
                    : row.original.vaId,
                })
              }
              onResetPassword={u => setCrmConfirm({ type: 'resetPw', user: u })}
              onDeactivate={u => setCrmConfirm({ type: 'deactivate', user: u })}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-xl font-semibold text-foreground">
            Account Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Client accounts and VA profiles — manage health metrics and CRM
            login access
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="client-accounts">
            <TabsList>
              <TabsTrigger value="client-accounts">Client Accounts</TabsTrigger>
              <TabsTrigger value="va-profiles">VA Profiles</TabsTrigger>
            </TabsList>

            <TabsContent value="client-accounts" className="mt-4">
              <DataTable
                columns={accountColumns}
                data={accounts}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="va-profiles" className="mt-4">
              <DataTable
                columns={profileColumns}
                data={profiles}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Client Account View Sheet */}
      <Sheet
        open={viewAccount !== null}
        onOpenChange={o => !o && setViewAccount(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {viewAccount
                ? (clientMap[viewAccount.clientId]?.companyName ??
                  viewAccount.clientId)
                : ''}
            </SheetTitle>
            <SheetDescription>Client account details</SheetDescription>
          </SheetHeader>
          {viewAccount && (
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Health Status</span>
                <HealthBadge status={viewAccount.healthStatus} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">BAA Signed</span>
                <span>{viewAccount.baaSigned ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">BAA Date</span>
                <span>{viewAccount.baaSignedDate?.slice(0, 10) ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Onboarding</span>
                <span>
                  {viewAccount.onboardingComplete ? 'Complete' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">SOP Received</span>
                <span>{viewAccount.sopReceived ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">EMR System</span>
                <span>{viewAccount.emrSystem ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Satisfaction Score
                </span>
                <span>{viewAccount.satisfactionScore ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Open Issues</span>
                <span>{viewAccount.openIssuesCount}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Primary Contact</span>
                <span>{viewAccount.primaryContact ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Secondary Contact</span>
                <span>{viewAccount.secondaryContact ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Last Check-in</span>
                <span>
                  {viewAccount.lastClientCheckin?.slice(0, 10) ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">CRM Login</span>
                <LoginStatusBadge user={crmClientMap[viewAccount.clientId]} />
              </div>
              {viewAccount.notes && (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {viewAccount.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* VA Profile View Sheet */}
      <Sheet
        open={viewProfile !== null}
        onOpenChange={o => !o && setViewProfile(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {viewProfile
                ? (() => {
                    const v = vaMap[viewProfile.vaId];
                    return v
                      ? `${v.firstName} ${v.lastName}`
                      : viewProfile.vaId;
                  })()
                : ''}
            </SheetTitle>
            <SheetDescription>VA profile details</SheetDescription>
          </SheetHeader>
          {viewProfile && (
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Workload Level</span>
                <WorkloadBadge level={viewProfile.workloadLevel} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Satisfaction Score
                </span>
                <span>{viewProfile.satisfactionScore ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Last Check-in</span>
                <span>{viewProfile.lastVaCheckin?.slice(0, 10) ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Burnout Risk</span>
                <span>{viewProfile.burnoutRiskFlag ? '🔴 Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Replacement Risk</span>
                <span>{viewProfile.replacementRiskFlag ? '🔴 Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">CRM Login</span>
                <LoginStatusBadge user={crmVaMap[viewProfile.vaId]} />
              </div>
              {viewProfile.notes && (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {viewProfile.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Client Account Edit Sheet */}
      <Sheet
        open={editAccount !== null}
        onOpenChange={o => !o && setEditAccount(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Client Account</SheetTitle>
            <SheetDescription>
              {editAccount
                ? (clientMap[editAccount.clientId]?.companyName ??
                  editAccount.clientId)
                : ''}
            </SheetDescription>
          </SheetHeader>
          {editAccount && (
            <EditClientAccountForm
              account={editAccount}
              onSuccess={() => {
                setEditAccount(null);
                queryClient.invalidateQueries({ queryKey: QK.clientAccounts });
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* VA Profile Edit Sheet */}
      <Sheet
        open={editProfile !== null}
        onOpenChange={o => !o && setEditProfile(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit VA Profile</SheetTitle>
            <SheetDescription>
              {editProfile
                ? (() => {
                    const v = vaMap[editProfile.vaId];
                    return v
                      ? `${v.firstName} ${v.lastName}`
                      : editProfile.vaId;
                  })()
                : ''}
            </SheetDescription>
          </SheetHeader>
          {editProfile && (
            <EditVaProfileForm
              profile={editProfile}
              onSuccess={() => {
                setEditProfile(null);
                queryClient.invalidateQueries({ queryKey: QK.vaProfiles });
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Provision Login Sheet */}
      <Sheet
        open={provisionTarget !== null}
        onOpenChange={o => !o && setProvisionTarget(null)}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Provision CRM Login</SheetTitle>
            <SheetDescription>{provisionTarget?.label ?? ''}</SheetDescription>
          </SheetHeader>
          {provisionTarget && (
            <ProvisionLoginForm
              role={provisionTarget.role}
              atsId={provisionTarget.atsId}
              defaultFirstName={provisionTarget.firstName}
              defaultLastName={provisionTarget.lastName}
              onSuccess={() => {
                setProvisionTarget(null);
                invalidateCrmUsers();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* CRM user action confirmation */}
      <ConfirmDialog
        open={crmConfirm !== null}
        title={
          crmConfirm?.type === 'resetPw' ? 'Reset Password' : 'Deactivate Login'
        }
        description={
          crmConfirm
            ? crmConfirm.type === 'resetPw'
              ? `Reset password for ${crmConfirm.user.firstName} ${crmConfirm.user.lastName}? A new temporary password will be emailed to them.`
              : `Deactivate CRM login for ${crmConfirm.user.firstName} ${crmConfirm.user.lastName}?`
            : ''
        }
        confirmLabel={
          crmConfirm?.type === 'resetPw' ? 'Reset Password' : 'Deactivate'
        }
        variant={crmConfirm?.type === 'deactivate' ? 'destructive' : 'default'}
        onConfirm={executeCrmConfirm}
        onCancel={() => setCrmConfirm(null)}
      />
    </div>
  );
}
