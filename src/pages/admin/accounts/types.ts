

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  clientRef?: string | null;
  candidateRef?: string | null;
  // client fields
  companyName?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  healthStatus?: string | null;
  satisfactionScore?: number | null;
  // va fields
  vaWorkload?: string | null;
  vaActiveClients?: number | null;
  vaTotalAssignments?: number | null;
  vaBurnoutRisk?: boolean | null;
  vaReplacementRisk?: boolean | null;
  vaSatisfactionScore?: number | null;
  // am fields
  amAssignmentCount?: number | null;
};
