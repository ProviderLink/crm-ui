export type EodWorkStatus = 'completed' | 'in_progress' | 'pending';

export type CommunicatedWithClient = 'yes' | 'no' | 'other';

export const COMMUNICATED_WITH_CLIENT_OPTIONS: CommunicatedWithClient[] = [
  'yes',
  'no',
  'other',
];

export const COMMUNICATED_WITH_CLIENT_LABELS: Record<
  CommunicatedWithClient,
  string
> = {
  yes: 'Yes',
  no: 'No',
  other: 'Other',
};

export const EOD_WORK_STATUSES: EodWorkStatus[] = [
  'completed',
  'in_progress',
  'pending',
];

export interface IEodWorkEntry {
  task: string;
  description: string;
  quantity: number;
  status: EodWorkStatus;
  timeSpent: number; // minutes
}

export interface IEodSubmission {
  _id: string;
  assignmentId: string;
  candidateId: string;
  clientId: string;
  candidateName?: string;
  companyName?: string;
  date: string; // 'YYYY-MM-DD'
  shiftStart: string; // 'HH:MM'
  shiftEnd: string; // 'HH:MM'
  hoursWorked: number;
  summaryOfWork?: string | null; // legacy free-text
  workEntries?: IEodWorkEntry[]; // structured per-work entries
  pendingTasks: string;
  blockers: string;
  notes?: string;
  communicatedWithClient?: CommunicatedWithClient | null;
  clientNote?: string | null;
  createdAt: string;
}

export interface CreateEodPayload {
  assignmentId: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  hoursWorked: number;
  summaryOfWork?: string | null;
  workEntries?: IEodWorkEntry[];
  pendingTasks: string;
  blockers: string;
  notes?: string;
  communicatedWithClient?: CommunicatedWithClient | null;
  clientNote?: string | null;
}
