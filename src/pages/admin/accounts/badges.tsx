

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-white/[0.04] text-text-secondary ring-[rgba(255,255,255,0.08)]',
    account_manager:
      'bg-white/[0.04] text-text-secondary ring-[rgba(255,255,255,0.08)]',
    va: 'bg-white/[0.04] text-text-secondary ring-[rgba(255,255,255,0.08)]',
    client: 'bg-white/[0.04] text-text-secondary ring-[rgba(255,255,255,0.08)]',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    account_manager: 'AM',
    va: 'VA',
    client: 'Client',
  };
  return (
    <span
      className={`inline-flex items-center rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 ring-1 ring-inset ${styles[role] ?? 'bg-white/[0.04] text-text-tertiary ring-[rgba(255,255,255,0.08)]'}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-status-success/10 px-2 py-0.5 text-status-success ring-1 ring-inset ring-status-success/25">
      <span className="size-1.5 rounded-full bg-status-success" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] px-2 py-0.5 text-text-tertiary ring-1 ring-inset ring-[rgba(255,255,255,0.08)]">
      <span className="size-1.5 rounded-full bg-text-tertiary/40" />
      Inactive
    </span>
  );
}
