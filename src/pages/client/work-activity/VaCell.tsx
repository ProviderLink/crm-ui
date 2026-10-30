const initialsOf = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/** The VA with their role underneath, behind an initials tile. */
export function VaCell({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
        {(name && initialsOf(name)) || '?'}
      </div>
      <div>
        <p className="text-sm font-medium whitespace-nowrap">{name ?? '—'}</p>
        <p className="text-xs whitespace-nowrap text-muted-foreground">
          {role ?? '—'}
        </p>
      </div>
    </div>
  );
}
