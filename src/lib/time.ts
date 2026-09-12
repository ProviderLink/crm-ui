/** Format minutes as "1h 30m" or "45m" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Decimal hours between two "HH:MM" strings, mirroring the backend's
 * `computeShiftHours`.
 *
 * An end time earlier than the start is treated as an overnight shift that
 * wraps past midnight (22:00 → 02:00 = 4h) instead of collapsing to 0.
 */
export function calcHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = (sh ?? 0) * 60 + (sm ?? 0);
  const endMin = (eh ?? 0) * 60 + (em ?? 0);
  const diff =
    endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
  return Math.round((Math.min(diff, 1440) / 60) * 100) / 100;
}

/** Today as "YYYY-MM-DD" in the user's local timezone */
export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format a `YYYY-MM-DD` business-day key as "Mar 4".
 *
 * Always formats from the string parts — never `new Date(key)`, which parses a
 * date-only value as UTC midnight and can render the previous day for users in
 * negative-offset timezones.
 */
export function formatDateKeyShort(dateKey: string): string {
  const [y, m, d] = dateKey.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Format a `YYYY-MM-DD` business-day key as "Mar 4, 2025". */
export function formatDateKeyLong(dateKey: string): string {
  const [y, m, d] = dateKey.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Shift a `YYYY-MM-DD` key by whole days, returning another `YYYY-MM-DD` key.
 *
 * Anchored at local noon so DST transitions can never push the result onto the
 * neighbouring day.
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Weekday of a `YYYY-MM-DD` key: 0 = Sunday … 6 = Saturday. */
export function weekdayOfDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getDay();
}

/** Current time as "HH:MM" */
export function nowTimeString(): string {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * Shift hours for a "HH:MM" pair, mirroring the backend's `computeShiftHours`.
 *
 * Unlike `calcHours`, an end time earlier than the start is treated as an
 * overnight shift that wraps past midnight (22:00 → 02:00 = 4h) instead of
 * collapsing to 0. The server is the source of truth for the stored value; this
 * is only used for the live preview in the form.
 */
export function computeShiftHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = (sh ?? 0) * 60 + (sm ?? 0);
  const endMin = (eh ?? 0) * 60 + (em ?? 0);
  const diff =
    endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
  return Math.round((Math.min(diff, 1440) / 60) * 100) / 100;
}
