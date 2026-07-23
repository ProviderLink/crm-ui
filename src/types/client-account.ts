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
  secondaryContact?: string;
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
  satisfactionScore?: number;
  baaSigned?: boolean;
  baaSignedDate?: string;
  onboardingComplete?: boolean;
  sopReceived?: boolean;
  primaryContact?: string;
  secondaryContact?: string;
  lastClientCheckin?: string;
  emrSystem?: string;
  openIssuesCount?: number;
  notes?: string;
}
