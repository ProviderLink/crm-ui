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
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';

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
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useAccountManagersQuery,
  useCrmAdminUsersQuery,
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
  getCrmAccountsList,
} from '@/services/account-managers.service';
import {
  getClientAccounts,
  getHiredVasForClient,
  updateClientAccount,
} from '@/services/client-accounts.service';
import {
  getVaAssignments,
  getVaProfiles,
  updateVaProfile,
} from '@/services/va-profiles.service';
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

function _DetailRow({
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
  // client fields
  companyName?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  healthStatus?: string | null;
  satisfactionScore?: number | null;
  // va fields
  vaWorkload?: string | null;
  vaActiveClients?: number | null;
  vaTotalAssignments?: number | null;
  vaBurnoutRisk?: boolean | null;
  vaReplacementRisk?: boolean | null;
  vaSatisfactionScore?: number | null;
  // am fields
  amAssignmentCount?: number | null;
};

const healthStyle: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
};
const healthLabel: Record<string, string> = {
  green: 'Healthy',
  yellow: 'At Risk',
  red: 'Critical',
};

function _buildUserColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs">
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

function buildClientColumns(
  onView: (u: UserRow) => void
): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'companyName',
      header: 'Client',
      cell: ({ row }) => {
        const { companyName } = row.original;
        const initials = (companyName ?? '?')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs">
              {initials}
            </div>
            <p className="text-sm font-semibold truncate">
              {companyName ?? '—'}
            </p>
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
            {primaryContactName && (
              <p className="text-sm font-medium truncate">
                {primaryContactName}
              </p>
            )}
            {primaryContactEmail && (
              <p className="text-xs text-muted-foreground truncate">
                {primaryContactEmail}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'healthStatus',
      header: 'Health',
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        if (!val)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${healthStyle[val] ?? healthStyle.green}`}
          >
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
        if (score == null)
          return <span className="text-xs text-muted-foreground">—</span>;
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

const workloadStyle: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  normal: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  overloaded: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

function buildVaColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Virtual Assistant',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate">
                {u.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {u.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaWorkload',
      header: 'Workload',
      cell: ({ row }) => {
        const w = row.original.vaWorkload;
        if (!w) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${workloadStyle[w] ?? 'bg-white/[0.04] text-muted-foreground ring-white/[0.08]'}`}
          >
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'vaTotalAssignments',
      header: 'Assignments',
      cell: ({ row }) => {
        const total = row.original.vaTotalAssignments ?? 0;
        const clients = row.original.vaActiveClients ?? 0;
        return (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tabular-nums">
              {total}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {clients} {clients === 1 ? 'client' : 'clients'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaSatisfactionScore',
      header: 'Satisfaction',
      cell: ({ row }) => {
        const score = row.original.vaSatisfactionScore;
        if (score == null)
          return <span className="text-xs text-muted-foreground">—</span>;
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
      accessorKey: 'vaBurnoutRisk',
      header: 'Risk',
      cell: ({ row }) => {
        const burnout = row.original.vaBurnoutRisk;
        const replacement = row.original.vaReplacementRisk;
        if (!burnout && !replacement) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2Icon className="size-3" />
              Clear
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {burnout && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
                <FlameIcon className="size-2.5" />
                Burnout
              </span>
            )}
            {replacement && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
                <AlertTriangleIcon className="size-2.5" />
                Replace
              </span>
            )}
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
      size: 120,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-lg text-xs gap-1.5"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3" />
          View Details
        </Button>
      ),
    },
  ];
}

function buildAmColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Account Manager',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <p className="text-sm font-medium leading-tight truncate">
              {u.name}
            </p>
          </div>
        );
      },
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
      accessorKey: 'amAssignmentCount',
      header: 'Assignments',
      cell: ({ row }) => {
        const count = row.original.amAssignmentCount ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <BriefcaseIcon className="size-3.5 text-muted-foreground" />
            <span className="font-medium tabular-nums">{count}</span>
            <span className="text-muted-foreground text-xs">active</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
  ];
}

function buildAdminColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Admin',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <p className="text-sm font-medium leading-tight truncate">
              {u.name}
            </p>
          </div>
        );
      },
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
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
  ];
}

// ─── Client Profile edit form inside sheet ────────────────────────────────────

function ClientProfileSection({ clientId }: { clientId: string }) {
  const user = useAppSelector(s => s.auth.user);
  const canEdit = user?.role === 'admin';
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
      const { data } = await api.get<{
        data: { status: string }[];
        meta: { total: number };
      }>(`/crm/assignments?clientId=${clientId}&limit=200`);
      return data.data;
    },
    enabled: !!clientId,
  });

  const totalAssignments = assignmentsData?.length ?? 0;
  const activeAssignments =
    assignmentsData?.filter(a => a.status === 'active').length ?? 0;

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
      await queryClient.invalidateQueries({
        queryKey: ['client-account', clientId],
      });
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
    green: {
      label: 'Healthy',
      className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    },
    yellow: {
      label: 'At Risk',
      className: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    },
    red: {
      label: 'Critical',
      className: 'bg-red-500/10 text-red-400 ring-red-500/20',
    },
  };
  const health = healthConfig[account.healthStatus] ?? healthConfig.green;

  return (
    <div className="pt-4 space-y-4">
      {/* CRM section label + edit */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          CRM Profile
        </span>
        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg gap-1"
            onClick={startEdit}
          >
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
              value={
                getFormVal('satisfactionScore')
                  ? String(getFormVal('satisfactionScore'))
                  : '0'
              }
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
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
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

          <Field label="Service Start Date">
            <DatePickerField
              value={toYMD(getFormVal('serviceStartDate', ''))}
              onChange={v =>
                setForm(p => ({ ...p, serviceStartDate: toISO(v) }))
              }
              placeholder="Pick date"
            />
          </Field>

          <div className="rounded-xl border border-border px-3 py-2.5 space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Status Flags
            </span>
            {(
              [
                { key: 'baaSigned', label: 'BAA Signed' },
                { key: 'onboardingComplete', label: 'Onboarding Complete' },
                { key: 'sopReceived', label: 'SOP Received' },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <Checkbox
                  checked={Boolean(getFormVal(key, false))}
                  onCheckedChange={v =>
                    setForm(p => ({ ...p, [key]: Boolean(v) }))
                  }
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {Boolean(getFormVal('baaSigned', false)) && (
            <Field label="BAA Signed Date">
              <DatePickerField
                value={toYMD(getFormVal('baaSignedDate', ''))}
                onChange={v =>
                  setForm(p => ({ ...p, baaSignedDate: toISO(v) }))
                }
                placeholder="Pick date"
              />
            </Field>
          )}

          <Field label="Last Check-in">
            <DatePickerField
              value={toYMD(getFormVal('lastClientCheckin', ''))}
              onChange={v =>
                setForm(p => ({ ...p, lastClientCheckin: toISO(v) }))
              }
              placeholder="Pick date"
            />
          </Field>

          <Field label="Open Issues">
            <Input
              type="number"
              min={0}
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
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setSuccess(false);
                }}
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                Changes saved successfully.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                icon: <UsersIcon className="size-4" />,
                value: hiredVas.length,
                label: 'VAs Hired',
              },
              {
                icon: <ActivityIcon className="size-4" />,
                value: activeAssignments,
                label: 'Active Assignments',
              },
              {
                icon: <BriefcaseIcon className="size-4" />,
                value: totalAssignments,
                label: 'Total Assignments',
              },
            ].map(({ icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 min-h-[88px]"
              >
                <span className="text-muted-foreground">{icon}</span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums leading-none">
                    {value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Health + Satisfaction */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Health</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${health.className}`}
              >
                {health.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-0.5">
                Satisfaction
              </span>
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Primary Contact
              </p>
              <div className="space-y-1">
                {account.primaryContact && (
                  <p className="text-sm font-medium">
                    {account.primaryContact}
                  </p>
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Compliance
            </p>
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
                  {done ? (
                    <CheckCircle2Icon className="size-3" />
                  ) : (
                    <CircleDashedIcon className="size-3" />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Details
            </p>
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
                <span className="text-xs text-muted-foreground">
                  Service Start
                </span>
                <span className="text-xs ml-auto">
                  {fmtDate(account.serviceStartDate)}
                </span>
              </div>
            )}
            {account.lastClientCheckin && (
              <div className="flex items-center gap-2">
                <ClockIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Last Check-in
                </span>
                <span className="text-xs ml-auto">
                  {fmtDate(account.lastClientCheckin)}
                </span>
              </div>
            )}
            {account.openIssuesCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-3.5 text-yellow-500 shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Open Issues
                </span>
                <span className="text-xs ml-auto text-yellow-500 font-medium">
                  {account.openIssuesCount}
                </span>
              </div>
            )}
            {!account.emrSystem &&
              !account.serviceStartDate &&
              !account.lastClientCheckin &&
              account.openIssuesCount === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No details yet.
                </p>
              )}
          </div>

          {/* Notes */}
          {account.notes && (
            <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Notes
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {account.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function durationLabel(start: string, end: string | null): string {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months = Math.round(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  if (months < 1) return '< 1 mo';
  if (months < 12) return `${months} mo`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}mo` : `${yrs}y`;
}

// ─── VA Profile Section ────────────────────────────────────────────────────────

function VaProfileSection({ vaId }: { vaId: string | null | undefined }) {
  const authUser = useAppSelector(s => s.auth.user);
  const canEdit = authUser?.role === 'admin';
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['va-profile', vaId],
    queryFn: async () => {
      const { data } = await api.get<{
        data: import('@/types/va-profile').IVaProfile;
      }>(`/crm/va-profiles/${vaId}`);
      return data.data;
    },
    enabled: !!vaId,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['va-assignments', vaId],
    queryFn: () => getVaAssignments(vaId!),
    enabled: !!vaId,
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!vaId) {
    return (
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground italic">
          This VA account is not yet linked to an ATS candidate record.
        </p>
      </div>
    );
  }

  if (profileLoading || assignmentsLoading) {
    return (
      <div className="border-t border-border pt-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-12 rounded-xl bg-white/[0.03] animate-pulse"
          />
        ))}
      </div>
    );
  }

  function getFormVal(key: string, fallback: unknown = '') {
    return form[key] !== undefined
      ? form[key]
      : ((profile as any)?.[key] ?? fallback);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateVaProfile(vaId!, form as any);
      await queryClient.invalidateQueries({ queryKey: ['va-profile', vaId] });
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

  const activeCount = assignments.filter(a => a.status === 'active').length;
  const totalCount = assignments.length;

  const workloadColors: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-500/10',
    normal: 'text-blue-400 bg-blue-500/10',
    high: 'text-amber-400 bg-amber-500/10',
    overloaded: 'text-red-400 bg-red-500/10',
  };

  const statusColors: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-500/10',
    on_hold: 'text-amber-400 bg-amber-500/10',
    ended: 'text-[#A0A0A0] bg-white/[0.04]',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    on_hold: 'On Hold',
    ended: 'Ended',
  };

  return (
    <div className="space-y-3">
      {/* Stats — same style as client profile */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <UsersIcon className="size-4" />,
            value: activeCount,
            label: 'Active Clients',
          },
          {
            icon: <BriefcaseIcon className="size-4" />,
            value: totalCount,
            label: 'Total Assignments',
          },
          {
            icon: <StarIcon className="size-4" />,
            value:
              profile?.satisfactionScore != null
                ? `${profile.satisfactionScore}/5`
                : '—',
            label: 'Satisfaction',
          },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 min-h-[88px]"
          >
            <span className="text-muted-foreground">{icon}</span>
            <div>
              <p className="text-2xl font-semibold tabular-nums leading-none">
                {value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CRM Profile header + edit toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          CRM Profile
        </span>
        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
            onClick={() => {
              setForm({});
              setEditing(true);
            }}
          >
            <Edit3Icon className="size-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-3 space-y-3">
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
                setForm(p => ({ ...p, satisfactionScore: Number(v) || null }))
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
          <div className="grid grid-cols-2 gap-3">
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
                  <SelectItem value="true">At risk</SelectItem>
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
                  <SelectItem value="true">At risk</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Last Check-in">
            <DatePickerField
              value={toYMD(getFormVal('lastVaCheckin', ''))}
              onChange={v => setForm(p => ({ ...p, lastVaCheckin: toISO(v) }))}
              placeholder="Pick date"
              toDate={new Date()}
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
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setSuccess(false);
                }}
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                Changes saved successfully.
              </p>
            )}
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Workload + Satisfaction */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Workload</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${workloadColors[profile.workloadLevel] ?? 'text-muted-foreground bg-white/[0.04] ring-white/[0.08]'}`}
              >
                {profile.workloadLevel.charAt(0).toUpperCase() +
                  profile.workloadLevel.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-0.5">
                Satisfaction
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`size-3 ${i < (profile.satisfactionScore ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Risk flags */}
          <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Risk Flags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Burnout Risk', flagged: profile.burnoutRiskFlag },
                {
                  label: 'Replacement Risk',
                  flagged: profile.replacementRiskFlag,
                },
              ].map(({ label, flagged }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${flagged ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'}`}
                >
                  {flagged ? (
                    <AlertTriangleIcon className="size-3" />
                  ) : (
                    <CheckCircle2Icon className="size-3" />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Details
            </p>
            <div className="flex items-center gap-2">
              <ClockIcon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Last Check-in
              </span>
              <span className="text-xs ml-auto">
                {fmtDate(profile.lastVaCheckin)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {profile.notes && (
            <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Notes
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {profile.notes}
              </p>
            </div>
          )}
        </>
      ) : null}

      {/* Client Assignments */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Client Assignments
        </span>
        <span className="text-[11px] text-muted-foreground">
          {totalCount} total
        </span>
      </div>

      {assignments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No assignments found.
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <div
              key={a._id}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <BuildingIcon className="size-3 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium leading-tight truncate">
                      {a.companyName || 'Unknown Client'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.serviceType}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${statusColors[a.status] ?? 'text-muted-foreground bg-white/[0.04]'}`}
                >
                  {statusLabels[a.status] ?? a.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {new Date(a.startDate).toLocaleDateString()}
                  {a.endDate
                    ? ` → ${new Date(a.endDate).toLocaleDateString()}`
                    : ' → Present'}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUpIcon className="size-3" />
                  {durationLabel(a.startDate, a.endDate)}
                </span>
              </div>
              {a.notes && (
                <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-white/[0.06] pt-2">
                  {a.notes}
                </p>
              )}
            </div>
          ))}
        </div>
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
  const isVa = user.role === 'va';
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
                ? (user.companyName ?? user.name)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              {isClient ? (
                <>
                  <p className="text-base font-semibold leading-tight truncate">
                    {user.companyName ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <RoleBadge role={user.role} />
                    <ActiveBadge active={user.isActive} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-semibold leading-tight">
                      {user.name}
                    </p>
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
          {isVa && <VaProfileSection vaId={user.candidateRef} />}
          {!showCrmProfile && (
            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Account Info
              </p>
              <p className="text-xs text-muted-foreground">
                Internal staff accounts do not have a separate CRM profile.
                Manage access and roles in the ATS system.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const authUser = useAppSelector(s => s.auth.user);
  const isAccountManager = authUser?.role === 'account_manager';
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  // Fetch CRM client & VA users via the self-scoped /shared/users/crm-accounts
  // endpoint. The backend scopes results to the caller's assignments for AMs
  // (so AMs don't need the team.read permission just to see their accounts).
  // AM users and admin users are still fetched from /shared/users (admins only,
  // gated by team.read server-side, but AM-tabs aren't shown to AMs anyway).
  const { data: crmAccounts, isLoading: loadingCrmAccounts } = useQuery({
    queryKey: ['crm-accounts-list'],
    queryFn: getCrmAccountsList,
  });
  const vaUsers = crmAccounts?.vas ?? [];
  const clientUsers = crmAccounts?.clients ?? [];

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

  const adminRows: UserRow[] = adminUsers.map(toRow);

  const { data: vaProfiles = [] } = useQuery({
    queryKey: ['va-profiles-list'],
    queryFn: getVaProfiles,
  });

  // Fetch all assignments (high limit) so we can count per VA without N+1 requests
  const { data: allAssignmentsData } = useQuery({
    queryKey: ['all-assignments-list'],
    queryFn: () =>
      import('@/lib/api').then(({ default: api }) =>
        api
          .get<{ data: any[] }>('/crm/assignments?limit=1000')
          .then(r => r.data.data ?? [])
      ),
  });

  const vaProfileByVaId = Object.fromEntries(vaProfiles.map(p => [p.vaId, p]));

  const assignmentsByCandidate: Record<
    string,
    { activeClients: Set<string>; total: number }
  > = {};
  for (const a of allAssignmentsData ?? []) {
    const cid = a.candidateId;
    if (!assignmentsByCandidate[cid])
      assignmentsByCandidate[cid] = { activeClients: new Set(), total: 0 };
    assignmentsByCandidate[cid].total++;
    if (a.status === 'active')
      assignmentsByCandidate[cid].activeClients.add(a.clientId);
  }

  const enrichedVaRows: UserRow[] = vaUsers.map(u => {
    const row = toRow(u);
    const profile = row.candidateRef
      ? vaProfileByVaId[row.candidateRef]
      : undefined;
    const counts = row.candidateRef
      ? assignmentsByCandidate[row.candidateRef]
      : undefined;
    return {
      ...row,
      vaWorkload: profile?.workloadLevel ?? null,
      vaActiveClients: counts?.activeClients.size ?? 0,
      vaTotalAssignments: counts?.total ?? 0,
      vaBurnoutRisk: profile?.burnoutRiskFlag ?? false,
      vaReplacementRisk: profile?.replacementRiskFlag ?? false,
      vaSatisfactionScore: profile?.satisfactionScore ?? null,
    };
  });

  // Count active assignments per account manager
  const activeByAm: Record<string, number> = {};
  for (const a of allAssignmentsData ?? []) {
    if (a.status === 'active' && a.accountManagerId) {
      activeByAm[a.accountManagerId] =
        (activeByAm[a.accountManagerId] ?? 0) + 1;
    }
  }

  const amRows: UserRow[] = amUsers.map(u => {
    const row = toRow(u);
    return { ...row, amAssignmentCount: activeByAm[row.id] ?? 0 };
  });

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

  // The /shared/users/crm-accounts endpoint already scopes clients and VAs
  // for AMs server-side, so no additional client-side AM filtering is needed.
  const scopedClientRows = clientRows;
  const scopedVaRows = enrichedVaRows;

  const isLoading = loadingCrmAccounts || loadingAm || loadingAdmin;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAccountManager
              ? 'View your assigned clients and virtual assistants'
              : 'View who has CRM access. Manage roles and access from the ATS.'}
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">
                Clients ({scopedClientRows.length})
              </TabsTrigger>
              <TabsTrigger value="vas">
                Virtual Assistants ({scopedVaRows.length})
              </TabsTrigger>
              {!isAccountManager && (
                <>
                  <TabsTrigger value="ams">
                    Account Managers ({amRows.length})
                  </TabsTrigger>
                  <TabsTrigger value="admins">
                    Admins ({adminRows.length})
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            <TabsContent value="clients" className="mt-4">
              <DataTable
                columns={buildClientColumns(setDetailUser)}
                data={scopedClientRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="vas" className="mt-4">
              <DataTable
                columns={buildVaColumns(setDetailUser)}
                data={scopedVaRows}
                isLoading={isLoading}
              />
            </TabsContent>
            {!isAccountManager && (
              <>
                <TabsContent value="ams" className="mt-4">
                  <DataTable
                    columns={buildAmColumns()}
                    data={amRows}
                    isLoading={isLoading}
                  />
                </TabsContent>
                <TabsContent value="admins" className="mt-4">
                  <DataTable
                    columns={buildAdminColumns()}
                    data={adminRows}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </>
            )}
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
