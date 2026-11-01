import { StarIcon } from 'lucide-react';

import { Pill, type PillTone } from '@/components/shared/Pill';
import { initialsOf } from '@/lib/format';
import { WORK_STATUS_TONE } from '@/lib/status-styles';
import { statusLabel } from '@/features/work-entries/format';
import type { IAssignment } from '@/types/assignment';
import { RATING_LABELS, type ReviewStatus } from '@/types/performance-review';
import type { SurveyStatus } from '@/types/survey-reminder';
import type { WorkEntryStatus } from '@/types/work-entry';

export function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    account_manager: 'Account Manager',
    va: 'VA',
    client: 'Client',
  };
  return <Pill>{labels[role] ?? role}</Pill>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Pill tone={active ? 'success' : 'neutral'}>
      <span
        className={`size-1.5 rounded-full ${active ? 'bg-status-success' : 'bg-text-tertiary/50'}`}
      />
      {active ? 'Active' : 'Inactive'}
    </Pill>
  );
}

const HEALTH: Record<string, { label: string; tone: PillTone }> = {
  green: { label: 'Healthy', tone: 'success' },
  yellow: { label: 'At Risk', tone: 'warning' },
  red: { label: 'Critical', tone: 'error' },
};

export function HealthBadge({ value }: { value: string }) {
  const h = HEALTH[value] ?? HEALTH.green!;
  return <Pill tone={h.tone}>{h.label}</Pill>;
}

const WORKLOAD: Record<string, PillTone> = {
  low: 'neutral',
  normal: 'neutral',
  high: 'warning',
  overloaded: 'error',
};

export function WorkloadBadge({ value }: { value: string }) {
  return (
    <Pill tone={WORKLOAD[value] ?? 'neutral'}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Pill>
  );
}

export function WorkStatusPill({ status }: { status: WorkEntryStatus }) {
  return <Pill tone={WORK_STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
}

const REVIEW_STATUS_TONE: Record<ReviewStatus, PillTone> = {
  Draft: 'muted',
  'AI Generated': 'info',
  'In Review': 'warning',
  Completed: 'success',
  'Sent to Client': 'strong',
  Archived: 'muted',
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Pill tone={REVIEW_STATUS_TONE[status] ?? 'muted'}>{status}</Pill>;
}

const SURVEY_STATUS_TONE: Record<SurveyStatus, PillTone> = {
  pending: 'warning',
  sent: 'info',
  completed: 'success',
  skipped: 'muted',
};

export function SurveyStatusPill({ status }: { status: SurveyStatus }) {
  return (
    <Pill tone={SURVEY_STATUS_TONE[status]} className="capitalize">
      {status}
    </Pill>
  );
}

const ASSIGNMENT_STATUS: Record<
  IAssignment['status'],
  { label: string; tone: PillTone }
> = {
  active: { label: 'Active', tone: 'success' },
  on_hold: { label: 'On hold', tone: 'warning' },
  ended: { label: 'Ended', tone: 'neutral' },
};

export function AssignmentStatusPill({
  status,
}: {
  status: IAssignment['status'];
}) {
  const s = ASSIGNMENT_STATUS[status];
  return <Pill tone={s?.tone ?? 'neutral'}>{s?.label ?? status}</Pill>;
}

/** One star and the score out of five; `withLabel` adds the rating's name as a tooltip. */
export function Score({
  value,
  withLabel = false,
}: {
  value: number | null | undefined;
  withLabel?: boolean;
}) {
  if (value == null)
    return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap tabular-nums"
      title={withLabel ? `${value} / 5 · ${RATING_LABELS[value]}` : undefined}
    >
      <StarIcon className="size-3.5 fill-status-warning text-status-warning" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">/ 5</span>
    </span>
  );
}

/** Initials of a person or company on a rounded tile. */
export function InitialsTile({
  name,
  size = 'sm',
}: {
  name: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] font-medium text-text-secondary ${size === 'md' ? 'size-10 text-sm' : 'size-8 text-xs'}`}
    >
      {initialsOf(name) || '?'}
    </div>
  );
}
