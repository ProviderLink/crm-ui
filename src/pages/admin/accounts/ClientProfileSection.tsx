import { ActivityIcon, AlertTriangleIcon, BriefcaseIcon, CalendarIcon, CheckCircle2Icon, CircleDashedIcon, ClockIcon, Edit3Icon, GaugeIcon, MailIcon, MonitorIcon, PhoneIcon, StarIcon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { NotesThread } from '@/components/notes/NotesThread';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/hooks/store';
import api from '@/lib/api';
import { getHiredVasForClient, updateClientAccount } from '@/services/client-accounts.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toISO, toYMD, fmtDate } from './date-utils';
import { Field } from './field';

export function ClientProfileSection({ clientId }: { clientId: string }) {
  const user = useAppSelector(s => s.auth.user);
  const canEdit =
    user?.role === 'admin' || user?.role === 'account_manager';
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

  // With no profile yet, show the empty state until the admin starts editing.
  if (!account && !editing) {
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
      : ((account as any)?.[key] ?? fallback);
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
      // The Accounts table enriches rows from this list.
      queryClient.invalidateQueries({ queryKey: ['client-accounts-list'] });
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
  const health =
    healthConfig[account?.healthStatus ?? 'green'] ?? healthConfig.green;

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
      ) : account ? (
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
      ) : null}

      {/* Admin internal notes thread (Requirement 4) — admin-only */}
      <NotesThread subjectType="client" subjectId={clientId} />
    </div>
  );
}
