export interface IScorecard {
  id: string
  vaId: string
  assignmentId: string
  weekStart: string
  weekEnd: string
  totalHours: number
  totalTasksCompleted: number
  avgTasksPerDay: number
  eodComplianceRate: number    // 0–1
  onTimeSubmissionRate: number // 0–1
  productivityScore: number    // 0–100
  categoryDistribution: Record<string, number>
  generatedAt: string
}
