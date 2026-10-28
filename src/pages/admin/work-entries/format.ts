import type { WorkEntryStatus } from '@/types/work-entry';

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// "2026-10-27" -> "Oct 27, 2026", built from parts so the day never shifts.
export function shortDate(raw?: string) {
  const [y, m, d] = (raw ?? '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '—';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const statusLabel = (s: WorkEntryStatus) =>
  s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1);
