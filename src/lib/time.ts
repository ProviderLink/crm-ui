/** Format minutes as "1h 30m" or "45m" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Calculate decimal hours between two "HH:MM" strings */
export function calcHours(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = (sh ?? 0) * 60 + (sm ?? 0)
  const endMin = (eh ?? 0) * 60 + (em ?? 0)
  return Math.max(0, Math.round(((endMin - startMin) / 60) * 10) / 10)
}

/** Today as "YYYY-MM-DD" */
export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

/** Current time as "HH:MM" */
export function nowTimeString(): string {
  return new Date().toTimeString().slice(0, 5)
}
