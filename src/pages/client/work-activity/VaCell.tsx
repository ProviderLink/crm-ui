export function VaCell({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-foreground">{name ?? '—'}</span>
      <span className="text-xs text-muted-foreground">{role ?? '—'}</span>
    </div>
  );
}
