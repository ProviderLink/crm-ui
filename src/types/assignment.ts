export interface IAssignment {
  _id: string;
  candidateId: string;
  clientId: string;
  companyName?: string;
  candidateName?: string;
  accountManagerName?: string;
  accountManagerEmail?: string;
  status: 'active' | 'on_hold' | 'ended';
  serviceType?: string;
  accountManagerId?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateAssignmentPayload {
  candidateId: string;
  clientId: string;
  accountManagerId: string;
  startDate: string;
  endDate?: string;
  status?: 'active' | 'on_hold' | 'ended';
  serviceType: string;
  notes?: string;
}

export interface UpdateAssignmentPayload {
  accountManagerId?: string;
  endDate?: string | null;
  status?: 'active' | 'on_hold' | 'ended';
  serviceType?: string;
  notes?: string;
}
