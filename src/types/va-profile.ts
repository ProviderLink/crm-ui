export type WorkloadLevel = 'low' | 'normal' | 'high' | 'overloaded'

export interface IVaProfile {
  id?: string
  vaId: string
  workloadLevel: WorkloadLevel
  satisfactionScore?: number
  burnoutRiskFlag: boolean
  replacementRiskFlag: boolean
  lastVaCheckin?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpdateVaProfilePayload {
  workloadLevel?: WorkloadLevel
  satisfactionScore?: number
  burnoutRiskFlag?: boolean
  replacementRiskFlag?: boolean
  lastVaCheckin?: string
  notes?: string
}
