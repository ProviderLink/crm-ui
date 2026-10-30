import type { ReactNode } from 'react';

// The same section and field wrappers as the other forms.
export { Field, Section } from '../../admin/assignments/form-layout';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground">
        End of Day Report
      </h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Submit your daily work summary to keep your team updated
      </p>
    </div>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <PageShell>
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </PageShell>
  );
}
