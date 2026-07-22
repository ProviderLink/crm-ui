import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Edit3Icon,
  EyeIcon,
  FlameIcon,
  GaugeIcon,
  MailIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
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
import { useAppSelector } from '@/hooks/store';
import api from '@/lib/api';
import {
  getAccountManagers,
  getCrmUsersByRole,
  type IAccountManager,
  type ICrmUser,
} from '@/services/account-managers.service';
import { updateClientAccount } from '@/services/client-accounts.service';
import { updateVaProfile } from '@/services/va-profiles.service';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
    account_manager:
      'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
    va: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
    client:
      'bg-green-500/10 text-green-700 dark:text-green-400 ring-green-500/20',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    account_manager: 'AM',
    va: 'VA',
    client: 'Client',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[role] ?? 'bg-muted text-muted-foreground ring-border'}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-500/20">
      <span className="size-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      Inactive
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {children ?? <span className="text-sm">{value}</span>}
      </div>
    </div>
  );
}

// ─── User tables ──────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  clientRef?: string | null;
  candidateRef?: string | null;
};

function buildUserColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {row.original.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => <RoleBadge role={getValue<string>()} />,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      id: 'actions',
      header: '',
      size: 50,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3.5" />
        </Button>
      ),
    },
  ];
}

// ─── Client Profile edit form inside sheet ────────────────────────────────────

function ClientProfileSection({ clientId }: { clientId: string }) {
  const user = useAppSelector(s => s.auth.user);
  const canEdit = user?.role === 'admin' || user?.role === 'account_manager';

  const { data: account, isLoading } = useQuery({
    queryKey: ['client-account', clientId],
    queryFn: async () => {
      const { data } = await api.get<{
        data: import('@/types/client-account').IClientAccount;
      }>(`/crm/client-accounts/${clientId}`);
      return data.data;
    },
    enabled: !!clientId,
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading profile…
        </p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground italic">
          No CRM profile yet — create one by editing.
        </p>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setForm({});
              setEditing(true);
            }}
          >
            <Edit3Icon className="size-3 mr-1.5" />
            Add Profile
          </Button>
        )}
      </div>
    );
  }

  function getFormVal(key: string, fallback: unknown = '') {
    return form[key] !== undefined
      ? form[key]
      : ((account as any)[key] ?? fallback);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateClientAccount(clientId, form as any);
      setEditing(false);
      // refetch handled by queryClient invalidation — just reset form
      setForm({});
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setForm({});
    setEditing(true);
  }

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          CRM Profile
        </span>
        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
            onClick={startEdit}
          >
            <Edit3Icon className="size-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {editing ? (
        <div className="space-y-3">
          <Field label="Health Status">
            <Select
              value={String(getFormVal('healthStatus', 'green'))}
              onValueChange={v => setForm(p => ({ ...p, healthStatus: v }))}
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">🟢 Green</SelectItem>
                <SelectItem value="yellow">🟡 Yellow</SelectItem>
                <SelectItem value="red">🔴 Red</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Satisfaction (1-5)">
            <Select
              value={String(getFormVal('satisfactionScore', ''))}
              onValueChange={v =>
                setForm(p => ({ ...p, satisfactionScore: Number(v) || null }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="BAA Signed">
            <Select
              value={String(getFormVal('baaSigned', false))}
              onValueChange={v =>
                setForm(p => ({ ...p, baaSigned: v === 'true' }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Onboarding Complete">
            <Select
              value={String(getFormVal('onboardingComplete', false))}
              onValueChange={v =>
                setForm(p => ({ ...p, onboardingComplete: v === 'true' }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="SOP Received">
            <Select
              value={String(getFormVal('sopReceived', false))}
              onValueChange={v =>
                setForm(p => ({ ...p, sopReceived: v === 'true' }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="EMR System">
            <Input
              value={String(getFormVal('emrSystem', ''))}
              onChange={e =>
                setForm(p => ({ ...p, emrSystem: e.target.value }))
              }
              placeholder="e.g. Epic, Cerner"
              className="rounded-xl h-9 text-sm"
            />
          </Field>
          <Field label="Primary Contact">
            <Input
              value={String(getFormVal('primaryContact', ''))}
              onChange={e =>
                setForm(p => ({ ...p, primaryContact: e.target.value }))
              }
              placeholder="Name / role"
              className="rounded-xl h-9 text-sm"
            />
          </Field>
          <Field label="Secondary Contact">
            <Input
              value={String(getFormVal('secondaryContact', ''))}
              onChange={e =>
                setForm(p => ({ ...p, secondaryContact: e.target.value }))
              }
              placeholder="Name / role"
              className="rounded-xl h-9 text-sm"
            />
          </Field>
          <Field label="Open Issues">
            <Input
              type="number"
              value={String(getFormVal('openIssuesCount', 0))}
              onChange={e =>
                setForm(p => ({
                  ...p,
                  openIssuesCount: Math.max(0, Number(e.target.value)),
                }))
              }
              className="rounded-xl h-9 text-sm"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={String(getFormVal('notes', ''))}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Internal notes…"
              className="rounded-xl text-sm resize-none"
              rows={2}
            />
          </Field>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <DetailRow
            icon={<GaugeIcon className="size-3.5" />}
            label="Health"
            value={
              account.healthStatus.charAt(0).toUpperCase() +
              account.healthStatus.slice(1)
            }
          />
          <DetailRow
            icon={<StarIcon className="size-3.5" />}
            label="Satisfaction"
            value={
              account.satisfactionScore != null
                ? `${account.satisfactionScore}/5`
                : '—'
            }
          />
          <DetailRow
            icon={<CheckCircle2Icon className="size-3.5" />}
            label="BAA"
            value={account.baaSigned ? 'Signed' : 'Not signed'}
          />
          <DetailRow
            icon={<CheckCircle2Icon className="size-3.5" />}
            label="Onboarding"
            value={account.onboardingComplete ? 'Complete' : 'Incomplete'}
          />
          <DetailRow
            icon={<CheckCircle2Icon className="size-3.5" />}
            label="SOP"
            value={account.sopReceived ? 'Received' : 'Not received'}
          />
          <DetailRow
            icon={<Edit3Icon className="size-3.5" />}
            label="EMR"
            value={account.emrSystem || '—'}
          />
          <DetailRow
            icon={<UsersIcon className="size-3.5" />}
            label="Primary Contact"
            value={account.primaryContact || '—'}
          />
          <DetailRow
            icon={<UsersIcon className="size-3.5" />}
            label="Secondary Contact"
            value={account.secondaryContact || '—'}
          />
          <DetailRow
            icon={<AlertTriangleIcon className="size-3.5" />}
            label="Open Issues"
            value={String(account.openIssuesCount)}
          />
          {account.lastClientCheckin && (
            <DetailRow
              icon={<ClockIcon className="size-3.5" />}
              label="Last Check-in"
              value={new Date(account.lastClientCheckin).toLocaleDateString()}
            />
          )}
          {account.notes && (
            <DetailRow
              icon={<Edit3Icon className="size-3.5" />}
              label="Notes"
              value={account.notes}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── VA Profile edit form inside sheet ────────────────────────────────────────

function VaProfileSection({ vaId }: { vaId: string }) {
  const user = useAppSelector(s => s.auth.user);
  const canEdit = user?.role === 'admin' || user?.role === 'account_manager';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['va-profile', vaId],
    queryFn: async () => {
      const { data } = await api.get<{
        data: import('@/types/va-profile').IVaProfile;
      }>(`/crm/va-profiles/${vaId}`);
      return data.data;
    },
    enabled: !!vaId,
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading profile…
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground italic">
          No VA profile yet — create one by editing.
        </p>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setForm({});
              setEditing(true);
            }}
          >
            <Edit3Icon className="size-3 mr-1.5" />
            Add Profile
          </Button>
        )}
      </div>
    );
  }

  function getFormVal(key: string, fallback: unknown = '') {
    return form[key] !== undefined
      ? form[key]
      : ((profile as any)[key] ?? fallback);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateVaProfile(vaId, form as any);
      setEditing(false);
      setForm({});
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setForm({});
    setEditing(true);
  }

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          CRM Profile
        </span>
        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
            onClick={startEdit}
          >
            <Edit3Icon className="size-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {editing ? (
        <div className="space-y-3">
          <Field label="Workload">
            <Select
              value={String(getFormVal('workloadLevel', 'normal'))}
              onValueChange={v => setForm(p => ({ ...p, workloadLevel: v }))}
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="overloaded">Overloaded</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Satisfaction (1-5)">
            <Select
              value={String(getFormVal('satisfactionScore', ''))}
              onValueChange={v =>
                setForm(p => ({
                  ...p,
                  satisfactionScore: v ? Number(v) : null,
                }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Burnout Risk">
            <Select
              value={String(getFormVal('burnoutRiskFlag', false))}
              onValueChange={v =>
                setForm(p => ({ ...p, burnoutRiskFlag: v === 'true' }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes — at risk</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Replacement Risk">
            <Select
              value={String(getFormVal('replacementRiskFlag', false))}
              onValueChange={v =>
                setForm(p => ({ ...p, replacementRiskFlag: v === 'true' }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes — at risk</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea
              value={String(getFormVal('notes', ''))}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Internal notes…"
              className="rounded-xl text-sm resize-none"
              rows={2}
            />
          </Field>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <DetailRow
            icon={<GaugeIcon className="size-3.5" />}
            label="Workload"
            value={
              profile.workloadLevel.charAt(0).toUpperCase() +
              profile.workloadLevel.slice(1)
            }
          />
          <DetailRow
            icon={<StarIcon className="size-3.5" />}
            label="Satisfaction"
            value={
              profile.satisfactionScore != null
                ? `${profile.satisfactionScore}/5`
                : '—'
            }
          />
          <DetailRow
            icon={<FlameIcon className="size-3.5" />}
            label="Burnout Risk"
            value={profile.burnoutRiskFlag ? '⚠️ At risk' : '✅ Low'}
          />
          <DetailRow
            icon={<AlertTriangleIcon className="size-3.5" />}
            label="Replacement Risk"
            value={profile.replacementRiskFlag ? '⚠️ At risk' : '✅ Low'}
          />
          {profile.lastVaCheckin && (
            <DetailRow
              icon={<ClockIcon className="size-3.5" />}
              label="Last Check-in"
              value={new Date(profile.lastVaCheckin).toLocaleDateString()}
            />
          )}
          {profile.notes && (
            <DetailRow
              icon={<Edit3Icon className="size-3.5" />}
              label="Notes"
              value={profile.notes}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Field wrapper ──────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function UserDetailSheet({
  user,
  open,
  onClose,
}: {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;

  const isClient = user.role === 'client' && !!user.clientRef;
  const isVa = user.role === 'va' && !!user.candidateRef;
  const showCrmProfile = isClient || isVa;

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account Details</SheetTitle>
          <SheetDescription>
            {showCrmProfile
              ? 'Identity from ATS. CRM profile managed below.'
              : 'Read-only view — manage access from the ATS.'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {/* Identity header */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
              {user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>

          {/* Identity fields */}
          <div className="border-t border-border pt-4 space-y-3">
            <DetailRow
              icon={<MailIcon className="size-3.5" />}
              label="Email"
              value={user.email}
            />
            <DetailRow
              icon={<ShieldCheckIcon className="size-3.5" />}
              label="Role"
              value={user.role}
            />
            <DetailRow
              icon={<UsersIcon className="size-3.5" />}
              label="Access Status"
              value={
                user.isActive
                  ? 'Active — has CRM access'
                  : 'Inactive — no CRM access'
              }
            />
          </div>

          {/* CRM profile section */}
          {isClient && <ClientProfileSection clientId={user.clientRef!} />}
          {isVa && <VaProfileSection vaId={user.candidateRef!} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const { data: vaUsers = [], isLoading: loadingVa } = useQuery({
    queryKey: ['shared-users', 'va'],
    queryFn: () => getCrmUsersByRole('va'),
  });
  const { data: clientUsers = [], isLoading: loadingClient } = useQuery({
    queryKey: ['shared-users', 'client'],
    queryFn: () => getCrmUsersByRole('client'),
  });
  const { data: amUsers = [], isLoading: loadingAm } = useQuery({
    queryKey: ['shared-users', 'am'],
    queryFn: () => getAccountManagers(),
  });
  const { data: adminUsers = [], isLoading: loadingAdmin } = useQuery({
    queryKey: ['shared-users', 'admin'],
    queryFn: () => getCrmUsersByRole('admin'),
  });

  function toRow(u: ICrmUser | IAccountManager): UserRow {
    const crmUser = u as ICrmUser;
    return {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      clientRef: crmUser.clientRef,
      candidateRef: crmUser.candidateRef,
    };
  }

  const vaRows: UserRow[] = vaUsers.map(toRow);
  const clientRows: UserRow[] = clientUsers.map(toRow);
  const amRows: UserRow[] = amUsers.map(toRow);
  const adminRows: UserRow[] = adminUsers.map(toRow);

  const isLoading = loadingVa || loadingClient || loadingAm || loadingAdmin;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View who has CRM access. Manage roles and access from the ATS.
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">
                Clients ({clientRows.length})
              </TabsTrigger>
              <TabsTrigger value="vas">
                Virtual Assistants ({vaRows.length})
              </TabsTrigger>
              <TabsTrigger value="ams">
                Account Managers ({amRows.length})
              </TabsTrigger>
              <TabsTrigger value="admins">
                Admins ({adminRows.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={clientRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="vas" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={vaRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="ams" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={amRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="admins" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={adminRows}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <UserDetailSheet
        user={detailUser}
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
      />
    </div>
  );
}
