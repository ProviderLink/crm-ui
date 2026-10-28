import { StarIcon } from 'lucide-react';

// Same pill language as the rest of the CRM: status colour on the text and a
// faint border only, never a coloured fill (see lib/status-styles.ts).
const PILL =
  'inline-flex items-center gap-1 rounded border bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium whitespace-nowrap';
const NEUTRAL = 'text-text-secondary border-white/[0.08]';
const SUCCESS = 'text-status-success border-status-success/20';
const WARNING = 'text-status-warning border-status-warning/20';
const ERROR = 'text-status-error border-status-error/20';

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const t = { neutral: NEUTRAL, success: SUCCESS, warning: WARNING, error: ERROR }[
    tone
  ];
  return <span className={`${PILL} ${t}`}>{children}</span>;
}

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

const HEALTH: Record<string, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  green: { label: 'Healthy', tone: 'success' },
  yellow: { label: 'At Risk', tone: 'warning' },
  red: { label: 'Critical', tone: 'error' },
};

export function HealthBadge({ value }: { value: string }) {
  const h = HEALTH[value] ?? HEALTH.green!;
  return <Pill tone={h.tone}>{h.label}</Pill>;
}

const WORKLOAD: Record<string, 'neutral' | 'warning' | 'error'> = {
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

/** One star and the score out of five, like the Ratings elsewhere. */
export function Score({ value }: { value: number | null | undefined }) {
  if (value == null)
    return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap tabular-nums">
      <StarIcon className="size-3.5 fill-status-warning text-status-warning" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">/ 5</span>
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
      {initials || '?'}
    </div>
  );
}
