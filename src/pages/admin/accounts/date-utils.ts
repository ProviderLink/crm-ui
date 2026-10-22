// yyyy-MM-dd → ISO 8601 datetime string the backend expects, or null
export function toISO(ymd: string): string | null {
  if (!ymd) return null;
  return new Date(ymd).toISOString();
}

// Convert any date value (ISO string, Date, etc.) → yyyy-MM-dd for DatePickerField
export function toYMD(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// Safe display formatter — never shows "Invalid Date"
export function fmtDate(val: unknown): string {
  if (!val) return '—';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function durationLabel(start: string, end: string | null): string {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months = Math.round(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  if (months < 1) return '< 1 mo';
  if (months < 12) return `${months} mo`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}mo` : `${yrs}y`;
}
