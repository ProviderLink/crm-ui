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
  /** Company business day, `YYYY-MM-DD`. */
  date: string;
  /** Same value as `date`; explicit company-day key. */
  dateKey?: string;
  /** IANA timezone that defined the business day (audit field). */
  dateTimezone?: string | null;
  /** Company-local wall clock, `HH:MM`. */
  shiftStart: string;
  shiftEnd: string;
  /** Derived server-side from the shift times. */
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
  /**
   * Company business day, `YYYY-MM-DD`.
   *
   * Omit this and the server files the EOD against the company's current day,
   * which is the correct behaviour for VAs working from another timezone.
   */
  date?: string;
  shiftStart: string;
  shiftEnd: string;
  /** Optional — the server recomputes hours from the shift times. */
  hoursWorked?: number;
  summaryOfWork?: string | null;
  workEntries?: IEodWorkEntry[];
  pendingTasks: string;
  blockers: string;
  notes?: string;
  communicatedWithClient?: CommunicatedWithClient | null;
  clientNote?: string | null;
}

/** Which company business day the EOD form should file against. */
export interface EodContext {
  dateKey: string;
  timezone: string;
}
