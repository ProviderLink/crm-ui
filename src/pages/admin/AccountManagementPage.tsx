import type { ColumnDef } from '@tanstack/react-table';
import {
  ActivityIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  Edit3Icon,
  EyeIcon,
  FlameIcon,
  GaugeIcon,
  MailIcon,
  MonitorIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useAccountManagersQuery,
  useCrmAdminUsersQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import api from '@/lib/api';

// yyyy-MM-dd → ISO 8601 datetime string the backend expects, or null
function toISO(ymd: string): string | null {
  if (!ymd) return null;
  return new Date(ymd).toISOString();
}

// Convert any date value (ISO string, Date, etc.) → yyyy-MM-dd for DatePickerField
function toYMD(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// Safe display formatter — never shows "Invalid Date"
function fmtDate(val: unknown): string {
  if (!val) return '—';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

import {
  type IAccountManager,
  type ICrmUser,
} from '@/services/account-managers.service';
import {
  getClientAccounts,
  getHiredVasForClient,
  updateClientAccount,
} from '@/services/client-accounts.service';
import { updateVaProfile } from '@/services/va-profiles.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-white/[0.04] text-[#A0A0A0] ring-[rgba(255,255,255,0.08)]',
    account_manager:
      'bg-white/[0.04] text-[#A0A0A0] ring-[rgba(255,255,255,0.08)]',
    va: 'bg-white/[0.04] text-[#A0A0A0] ring-[rgba(255,255,255,0.08)]',
    client: 'bg-white/[0.04] text-[#A0A0A0] ring-[rgba(255,255,255,0.08)]',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    account_manager: 'AM',
    va: 'VA',
    client: 'Client',
  };
  return (
    <span
      className={`inline-flex items-center rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 ring-1 ring-inset ${styles[role] ?? 'bg-white/[0.04] text-[#6E6E6E] ring-[rgba(255,255,255,0.08)]'}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] px-2 py-0.5 text-[#A0A0A0] ring-1 ring-inset ring-[rgba(255,255,255,0.08)]">
      <span className="size-1.5 rounded-full bg-[#A0A0A0]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] px-2 py-0.5 text-[#6E6E6E] ring-1 ring-inset ring-[rgba(255,255,255,0.08)]">
      <span className="size-1.5 rounded-full bg-[#6E6E6E]/40" />
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
  companyName?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  healthStatus?: string | null;
  satisfactionScore?: number | null;
};

const healthStyle: Record<string, string> = {
  green:  'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red:    'bg-red-500/10 text-red-400 ring-red-500/20',
};
const healthLabel: Record<string, string> = {
  green: 'Healthy', yellow: 'At Risk', red: 'Critical',
};

function buildUserColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs">
            {row.original.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
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
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onView(row.original)}>
          <EyeIcon className="size-3.5" />
        </Button>
      ),
    },
  ];
}

function buildClientColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'companyName',
      header: 'Client',
      cell: ({ row }) => {
        const { companyName } = row.original;
        const initials = (companyName ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs">
              {initials}
            </div>
            <p className="text-sm font-semibold truncate">{companyName ?? '—'}</p>
          </div>
        );
      },
    },
    {
      id: 'primaryContact',
      header: 'Primary Contact',
      cell: ({ row }) => {
        const { primaryContactName, primaryContactEmail } = row.original;
        if (!primaryContactName && !primaryContactEmail)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="min-w-0">
            {primaryContactName && <p className="text-sm font-medium truncate">{primaryContactName}</p>}
            {primaryContactEmail && <p className="text-xs text-muted-foreground truncate">{primaryContactEmail}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'healthStatus',
      header: 'Health',
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        if (!val) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${healthStyle[val] ?? healthStyle.green}`}>
            {healthLabel[val] ?? val}
          </span>
        );
      },
    },
    {
      accessorKey: 'satisfactionScore',
      header: 'Satisfaction',
      cell: ({ getValue }) => {
        const score = getValue<number | null>();
        if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`size-3 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3.5" />
          View Details
        </Button>
      ),
    },
  ];
}

// ─── Client Profile edit form inside sheet ────────────────────────────────────

function ClientProfileSection({ clientId }: { clientId: string }) {
  const user = useAppSelector(s => s.auth.user);
  const canEdit = user?.role === 'admin' || user?.role === 'account_manager';
  const queryClient = useQueryClient();

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

  const { data: hiredVas = [] } = useQuery({
    queryKey: ['client-hired-vas', clientId],
    queryFn: () => getHiredVasForClient(clientId),
    enabled: !!clientId,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['client-assignments', clientId],
    queryFn: async () => {
      const { data } = await api.get<{ data: { status: string }[]; meta: { total: number } }>(
        `/crm/assignments?clientId=${clientId}&limit=200`
      );
      return data.data;
    },
    enabled: !!clientId,
  });

  const totalAssignments = assignmentsData?.length ?? 0;
  const activeAssignments = assignmentsData?.filter(a => a.status === 'active').length ?? 0;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
    try {
      await updateClientAccount(clientId, form as any);
      await queryClient.invalidateQueries({ queryKey: ['client-account', clientId] });
      setSuccess(true);
      setTimeout(() => {
        setEditing(false);
        setForm({});
        setSuccess(false);
      }, 1200);
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

  const healthConfig: Record<string, { label: string; className: string }> = {
    green:  { label: 'Healthy',  className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
    yellow: { label: 'At Risk',  className: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
    red:    { label: 'Critical', className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  };
  const health = healthConfig[account.healthStatus] ?? healthConfig.green;

  return (
    <div className="pt-4 space-y-4">
      {/* CRM section label + edit */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">CRM Profile</span>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={startEdit}>
            <Edit3Icon className="size-3" />
            Edit
          </Button>
        )}
      </div>

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
              value={getFormVal('satisfactionScore') ? String(getFormVal('satisfactionScore')) : '0'}
              onValueChange={v =>
                setForm(p => ({ ...p, satisfactionScore: Number(v) || null }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">—</SelectItem>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="EMR System">
            <Input
              value={String(getFormVal('emrSystem', ''))}
              onChange={e => setForm(p => ({ ...p, emrSystem: e.target.value }))}
              placeholder="e.g. Epic, Cerner"
              className="rounded-xl h-9 text-sm"
            />
          </Field>

          <Field label="Service Start Date">
            <DatePickerField
              value={toYMD(getFormVal('serviceStartDate', ''))}
              onChange={v => setForm(p => ({ ...p, serviceStartDate: toISO(v) }))}
              placeholder="Pick date"
            />
          </Field>

          <div className="rounded-xl border border-border px-3 py-2.5 space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status Flags</span>
            {(
              [
                { key: 'baaSigned', label: 'BAA Signed' },
                { key: 'onboardingComplete', label: 'Onboarding Complete' },
                { key: 'sopReceived', label: 'SOP Received' },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={Boolean(getFormVal(key, false))}
                  onCheckedChange={v => setForm(p => ({ ...p, [key]: Boolean(v) }))}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {Boolean(getFormVal('baaSigned', false)) && (
            <Field label="BAA Signed Date">
              <DatePickerField
                value={toYMD(getFormVal('baaSignedDate', ''))}
                onChange={v => setForm(p => ({ ...p, baaSignedDate: toISO(v) }))}
                placeholder="Pick date"
              />
            </Field>
          )}

          <Field label="Last Check-in">
            <DatePickerField
              value={toYMD(getFormVal('lastClientCheckin', ''))}
              onChange={v => setForm(p => ({ ...p, lastClientCheckin: toISO(v) }))}
              placeholder="Pick date"
            />
          </Field>

          <Field label="Open Issues">
            <Input
              type="number"
              min={0}
              value={String(getFormVal('openIssuesCount', 0))}
              onChange={e =>
                setForm(p => ({ ...p, openIssuesCount: Math.max(0, Number(e.target.value)) }))
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

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-xl" onClick={handleSave} disabled={saving || success}>
                {saving ? 'Saving…' : success ? 'Saved!' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { setEditing(false); setError(''); setSuccess(false); }}>
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">Changes saved successfully.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <UsersIcon className="size-4" />, value: hiredVas.length, label: 'VAs Hired' },
              { icon: <ActivityIcon className="size-4" />, value: activeAssignments, label: 'Active Assignments' },
              { icon: <BriefcaseIcon className="size-4" />, value: totalAssignments, label: 'Total Assignments' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="flex flex-col justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 min-h-[88px]">
                <span className="text-muted-foreground">{icon}</span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Health + Satisfaction */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Health</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${health.className}`}>
                {health.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-0.5">Satisfaction</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`size-3 ${i < (account.satisfactionScore ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          {(account.primaryContact || account.primaryContactEmail) && (
            <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Primary Contact</p>
              <div className="space-y-1">
                {account.primaryContact && (
                  <p className="text-sm font-medium">{account.primaryContact}</p>
                )}
                {account.primaryContactEmail && (
                  <a
                    href={`mailto:${account.primaryContactEmail}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MailIcon className="size-3" />
                    {account.primaryContactEmail}
                  </a>
                )}
                {account.primaryContactPhone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PhoneIcon className="size-3" />
                    {account.primaryContactPhone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status flags */}
          <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Compliance</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'BAA Signed', done: account.baaSigned },
                { label: 'Onboarding', done: account.onboardingComplete },
                { label: 'SOP Received', done: account.sopReceived },
              ].map(({ label, done }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                    done
                      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                      : 'bg-white/[0.03] text-muted-foreground/60 ring-white/[0.06]'
                  }`}
                >
                  {done
                    ? <CheckCircle2Icon className="size-3" />
                    : <CircleDashedIcon className="size-3" />
                  }
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Details</p>
            {account.emrSystem && (
              <div className="flex items-center gap-2">
                <MonitorIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">EMR</span>
                <span className="text-xs ml-auto">{account.emrSystem}</span>
              </div>
            )}
            {account.serviceStartDate && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Service Start</span>
                <span className="text-xs ml-auto">{fmtDate(account.serviceStartDate)}</span>
              </div>
            )}
            {account.lastClientCheckin && (
              <div className="flex items-center gap-2">
                <ClockIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Last Check-in</span>
                <span className="text-xs ml-auto">{fmtDate(account.lastClientCheckin)}</span>
              </div>
            )}
            {account.openIssuesCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-3.5 text-yellow-500 shrink-0" />
                <span className="text-xs text-muted-foreground">Open Issues</span>
                <span className="text-xs ml-auto text-yellow-500 font-medium">{account.openIssuesCount}</span>
              </div>
            )}
            {!account.emrSystem && !account.serviceStartDate && !account.lastClientCheckin && account.openIssuesCount === 0 && (
              <p className="text-xs text-muted-foreground italic">No details yet.</p>
            )}
          </div>

          {/* Notes */}
          {account.notes && (
            <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{account.notes}</p>
            </div>
          )}

        </div>
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
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
      setTimeout(() => {
        setEditing(false);
        setForm({});
        setSuccess(false);
      }, 1200);
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
              value={
                getFormVal('satisfactionScore')
                  ? String(getFormVal('satisfactionScore'))
                  : '0'
              }
              onValueChange={v =>
                setForm(p => ({
                  ...p,
                  satisfactionScore: Number(v) || null,
                }))
              }
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">—</SelectItem>
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
          <Field label="Last Check-in">
            <DatePickerField
              value={String(getFormVal('lastVaCheckin', ''))}
              onChange={v => setForm(p => ({ ...p, lastVaCheckin: v || null }))}
              placeholder="Pick date"
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
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-xl"
                onClick={handleSave}
                disabled={saving || success}
              >
                {saving ? 'Saving…' : success ? 'Saved!' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => { setEditing(false); setError(''); setSuccess(false); }}
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">Changes saved successfully.</p>
            )}
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
      <SheetContent className="sm:max-w-md overflow-y-auto p-0">
        {/* Hero header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="sr-only">Account Details</SheetTitle>
          <SheetDescription className="sr-only">
            {showCrmProfile ? 'CRM account profile' : 'Read-only account view'}
          </SheetDescription>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#A0A0A0] font-mono text-base font-medium border border-white/[0.08]">
              {isClient
                ? (user.companyName ?? user.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              }
            </div>
            <div className="flex-1 min-w-0">
              {isClient ? (
                <>
                  <p className="text-base font-semibold leading-tight truncate">{user.companyName ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <RoleBadge role={user.role} />
                    <ActiveBadge active={user.isActive} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-semibold leading-tight">{user.name}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    <MailIcon className="size-3 shrink-0" />
                    {user.email}
                  </a>
                  <div className="mt-2">
                    <ActiveBadge active={user.isActive} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {isClient && <ClientProfileSection clientId={user.clientRef!} />}
          {isVa && <VaProfileSection vaId={user.candidateRef!} />}
          {!showCrmProfile && (
            <p className="mt-6 text-xs text-muted-foreground italic">
              No CRM profile for this account type.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const { data: vaUsers = [], isLoading: loadingVa } = useCrmVaUsersQuery();
  const { data: clientUsers = [], isLoading: loadingClient } =
    useCrmClientUsersQuery();
  const { data: amUsers = [], isLoading: loadingAm } =
    useAccountManagersQuery();
  const { data: adminUsers = [], isLoading: loadingAdmin } =
    useCrmAdminUsersQuery();

  function toRow(u: ICrmUser | IAccountManager): UserRow {
    const roles = u.roles ?? [];
    return {
      id: u.id ?? u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: roles[0] ?? 'unknown',
      isActive: u.isActive,
      clientRef: (u as ICrmUser).clientRef,
      candidateRef: (u as ICrmUser).candidateRef,
    };
  }

  const vaRows: UserRow[] = vaUsers.map(toRow);
  const amRows: UserRow[] = amUsers.map(toRow);
  const adminRows: UserRow[] = adminUsers.map(toRow);

  const { data: clientAccounts = [] } = useQuery({
    queryKey: ['client-accounts-list'],
    queryFn: getClientAccounts,
  });

  const accountByClientId = Object.fromEntries(
    clientAccounts.map(a => [a.clientId, a])
  );

  const clientRows: UserRow[] = clientUsers.map(u => {
    const row = toRow(u);
    const acc = row.clientRef ? accountByClientId[row.clientRef] : undefined;
    return {
      ...row,
      companyName: acc?.companyName ?? null,
      primaryContactName: acc?.primaryContact ?? null,
      primaryContactEmail: acc?.primaryContactEmail ?? null,
      healthStatus: acc?.healthStatus ?? null,
      satisfactionScore: acc?.satisfactionScore ?? null,
    };
  });

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
                columns={buildClientColumns(setDetailUser)}
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
