export interface IAtsClientContact {
  name: string;
  email: string;
  phone?: string;
  position: string;
  isPrimary: boolean;
}

export interface IAtsClient {
  id: string;
  companyName: string;
  email?: string;
  status: 'active' | 'inactive' | 'pending' | 'on_hold';
  contacts?: IAtsClientContact[];
}

export interface IAtsCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  clientIds?: string[];
  status:
    | 'active'
    | 'hired'
    | 'interviewing'
    | 'offered'
    | 'rejected'
    | 'withdrawn';
}

export interface IAtsUser {
  id: string;
  firstName: string;
  lastName: string;
}
