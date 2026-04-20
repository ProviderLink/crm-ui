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

/** Today as "YYYY-MM-DD" in the user's local timezone */
export function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Current time as "HH:MM" */
export function nowTimeString(): string {
  return new Date().toTimeString().slice(0, 5)
}
