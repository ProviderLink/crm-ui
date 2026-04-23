export interface IAssignment {
  id: string
  clientId: string
  vaId: string
  status: 'active' | 'paused' | 'ended'
  serviceType?: string
  accountManagerId?: string
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
}

export interface CreateAssignmentPayload {
  clientId: string
  vaId: string
  accountManagerId: string
  startDate: string
  endDate?: string
  status?: 'active' | 'paused' | 'ended'
  serviceType: string
  notes?: string
}

export interface UpdateAssignmentPayload {
  accountManagerId?: string
  endDate?: string | null  // null = delete the field from Firestore
  status?: 'active' | 'paused' | 'ended'
  serviceType?: string
  notes?: string
}
