export interface IAtsClient {
  id: string
  companyName: string
  status: 'active' | 'inactive' | 'pending' | 'on_hold'
}

export interface IAtsCandidate {
  id: string
  firstName: string
  lastName: string
  clientId?: string
  status:
    | 'active'
    | 'hired'
    | 'interviewing'
    | 'offered'
    | 'rejected'
    | 'withdrawn'
}

export interface IAtsUser {
  id: string
  firstName: string
  lastName: string
}
