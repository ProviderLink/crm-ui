export type WorkloadLevel = 'low' | 'normal' | 'high' | 'overloaded'

export interface IVaProfile {
  id?: string
  va_id: string
  workload_level: WorkloadLevel
  satisfaction_score?: number
  burnout_risk_flag: boolean
  replacement_risk_flag: boolean
  last_va_checkin?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateVaProfilePayload {
  workloadLevel?: WorkloadLevel
  satisfactionScore?: number
  burnoutRiskFlag?: boolean
  replacementRiskFlag?: boolean
  lastVaCheckin?: string
  notes?: string
}
