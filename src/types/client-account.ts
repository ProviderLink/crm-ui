export type HealthStatus = 'green' | 'yellow' | 'red';

export interface IClientAccount {
  id?: string;
  clientId: string;
  companyName: string;
  accountOwnerId: string;
  serviceStartDate?: string;
  emrSystem?: string;
  baaSigned: boolean;
  baaSignedDate?: string;
  onboardingComplete: boolean;
  sopReceived: boolean;
  primaryContact?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  secondaryContact?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  lastClientCheckin?: string;
  satisfactionScore?: number;
  healthStatus: HealthStatus;
  openIssuesCount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateClientAccountPayload {
  healthStatus?: HealthStatus;
  satisfactionScore?: number | null;
  baaSigned?: boolean;
  baaSignedDate?: string | null;
  onboardingComplete?: boolean;
  sopReceived?: boolean;
  lastClientCheckin?: string | null;
  emrSystem?: string;
  serviceStartDate?: string | null;
  openIssuesCount?: number;
  notes?: string;
}
