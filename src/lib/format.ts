import { dateKeyToLocalDate } from '@/lib/time';

/** "Ayesha Rahman" -> "AR": up to two initials for an avatar tile. */
export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/** `plural(3, 'day')` -> "3 days", `plural(1, 'day')` -> "1 day". */
export const plural = (n: number, word: string): string =>
  `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * "Oct 27, 2026" from a `YYYY-MM-DD` key or ISO string, or "—" when it is
 * missing or invalid. Built from the date parts, so the day never shifts with
 * the viewer's timezone.
 */
export function formatDate(raw?: string | null): string {
  const date = raw ? dateKeyToLocalDate(raw) : null;
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Oct 27, 2026, 4:05 PM" from a timestamp; "—" when missing, raw when invalid. */
export function formatDateTime(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Tuesday, Oct 27, 2026" from a date key; the raw value when invalid. */
export function formatDateWeekday(raw?: string | null): string {
  const date = raw ? dateKeyToLocalDate(raw) : null;
  if (!date) return raw ?? '—';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
