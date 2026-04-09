export interface IScorecard {
  id: string
  va_id: string
  assignment_id: string
  week_start: string
  week_end: string
  total_hours: number
  total_tasks_completed: number
  avg_tasks_per_day: number
  eod_compliance_rate: number // 0–1
  on_time_submission_rate: number // 0–1
  productivity_score: number // 0–100
  category_distribution: Record<string, number>
  generated_at: string
}
