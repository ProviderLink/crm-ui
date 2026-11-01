export type WorkloadLevel = 'low' | 'normal' | 'high' | 'overloaded';

export interface IVaProfile {
  id?: string;
  vaId: string;
  workloadLevel: WorkloadLevel;
  satisfactionScore?: number;
  burnoutRiskFlag: boolean;
  replacementRiskFlag: boolean;
  lastVaCheckin?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateVaProfilePayload {
  workloadLevel?: WorkloadLevel;
  satisfactionScore?: number | null;
  burnoutRiskFlag?: boolean;
  replacementRiskFlag?: boolean;
  lastVaCheckin?: string | null;
  notes?: string;
}

export interface IVaAssignment {
  _id: string;
  clientId: string;
  companyName: string;
  status: 'active' | 'on_hold' | 'ended';
  serviceType: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}
