import { AlertTriangleIcon, BriefcaseIcon, BuildingIcon, CalendarIcon, CheckCircle2Icon, ClockIcon, Edit3Icon, GaugeIcon, StarIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { NotesThread } from '@/components/notes/NotesThread';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/hooks/store';
import api from '@/lib/api';
import type { UpdateVaProfilePayload } from '@/types/va-profile';
import { getVaAssignments, updateVaProfile } from '@/services/va-profiles.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toISO, toYMD, fmtDate, durationLabel } from './date-utils';
import { Field } from './field';

export function VaProfileSection({ vaId }: { vaId: string | null | undefined }) {
  const authUser = useAppSelector(s => s.auth.user);
  const canEdit =
    authUser?.role === 'admin' || authUser?.role === 'account_manager';
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
      : ((profile as unknown as Record<string, unknown> | undefined)?.[key] ?? fallback);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateVaProfile(vaId!, form as UpdateVaProfilePayload);
      await queryClient.invalidateQueries({ queryKey: ['va-profile', vaId] });
      // The Accounts table enriches rows from this list.
      queryClient.invalidateQueries({ queryKey: ['va-profiles-list'] });
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
    low: 'text-status-success bg-white/[0.04]',
    normal: 'text-status-info bg-white/[0.04]',
    high: 'text-status-warning bg-white/[0.04]',
    overloaded: 'text-status-error bg-white/[0.04]',
  };

  const statusColors: Record<string, string> = {
    active: 'text-status-success bg-white/[0.04]',
    on_hold: 'text-status-warning bg-white/[0.04]',
    ended: 'text-text-secondary bg-white/[0.04]',
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
        ].map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] p-3"
          >
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
        <span className="text-sm font-semibold text-foreground">
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
        <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-3 space-y-3">
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
              <p className="text-xs text-status-success bg-white/[0.04] rounded-lg px-3 py-2">
                Changes saved successfully.
              </p>
            )}
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Workload + Satisfaction */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Workload</span>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${workloadColors[profile.workloadLevel] ?? 'text-muted-foreground bg-white/[0.04] ring-white/[0.08]'}`}
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
                    className={`size-3 ${i < (profile.satisfactionScore ?? 0) ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Risk flags */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Risk Flags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: 'Burnout risk',
                  clear: 'No burnout risk',
                  flagged: profile.burnoutRiskFlag,
                },
                {
                  label: 'Replacement risk',
                  clear: 'No replacement risk',
                  flagged: profile.replacementRiskFlag,
                },
              ].map(({ label, clear, flagged }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${flagged ? 'bg-white/[0.04] text-status-error ring-status-error/20' : 'bg-white/[0.04] text-status-success ring-status-success/20'}`}
                >
                  {flagged ? (
                    <AlertTriangleIcon className="size-3" />
                  ) : (
                    <CheckCircle2Icon className="size-3" />
                  )}
                  {flagged ? label : clear}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">
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
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground mb-1.5">
                Notes
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {profile.notes}
              </p>
            </div>
          )}
        </>
      ) : null}

      {/* Admin internal notes thread (Requirement 4) — admin-only */}
      <NotesThread subjectType="va" subjectId={vaId} />

      {/* Client Assignments */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-foreground">
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
              className="rounded-lg border border-white/[0.1] bg-white/[0.03] p-3 space-y-2"
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
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[a.status] ?? 'text-muted-foreground bg-white/[0.04]'}`}
                >
                  {statusLabels[a.status] ?? a.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {fmtDate(a.startDate)}
                  {a.endDate
                    ? ` → ${fmtDate(a.endDate)}`
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
