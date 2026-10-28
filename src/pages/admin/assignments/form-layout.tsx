import { type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function Section({
  icon,
  title,
  optional = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </h3>
        {optional && (
          <span className="text-xs text-muted-foreground">Optional</span>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
