/** A flat section of the review drawer: a heading, optional actions, content. */
export function SectionCard({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}
