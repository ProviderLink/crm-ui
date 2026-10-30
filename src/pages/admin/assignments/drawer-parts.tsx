import { MailIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Small pieces ─────────────────────────────────────────────────────────────

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function Party({
  label,
  name,
  email,
  children,
}: {
  label: string;
  name: string;
  email?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-tight">{name}</p>
      {email && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MailIcon className="size-3 shrink-0" />
          <span className="truncate">{email}</span>
        </p>
      )}
      {children}
    </div>
  );
}

export const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span>{label}</span>
    {children}
  </div>
);

