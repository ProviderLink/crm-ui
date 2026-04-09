export type HealthStatus = 'green' | 'yellow' | 'red'

export interface IClientAccount {
  id?: string
  client_id: string
  account_owner_id: string
  service_start_date?: string
  emr_system?: string
  baa_signed: boolean
  baa_signed_date?: string
  onboarding_complete: boolean
  sop_received: boolean
  primary_contact?: string
  secondary_contact?: string
  last_client_checkin?: string
  satisfaction_score?: number
  health_status: HealthStatus
  open_issues_count: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateClientAccountPayload {
  healthStatus?: HealthStatus
  satisfactionScore?: number
  baaSigned?: boolean
  baaSignedDate?: string
  onboardingComplete?: boolean
  sopReceived?: boolean
  primaryContact?: string
  secondaryContact?: string
  lastClientCheckin?: string
  emrSystem?: string
  openIssuesCount?: number
  notes?: string
}
