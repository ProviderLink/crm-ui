import { ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-2xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PageHeader() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList size={18} className="text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          End of Day Report
        </h1>
      </div>
      <p className="text-sm text-muted-foreground ml-7">
        Submit your daily work summary to keep your team updated
      </p>
    </div>
  );
}

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
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {optional && (
          <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Optional
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

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
    <div className="space-y-1.5">
      {label && (
        <Label className="text-sm font-medium text-foreground block mb-1">
          {label}
        </Label>
      )}
      {hint && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {hint}
        </p>
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-8 text-center">
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <PageShell>
      <div className="mb-5 space-y-2">
        <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border border-border mb-4">
          <div className="h-10 border-b border-border bg-muted/30 rounded-t-2xl animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </PageShell>
  );
}
