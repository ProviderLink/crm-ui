import { useAppSelector } from '@/hooks/store';
import {
  getAccountManagers,
  getCrmUsersByRole,
} from '@/services/account-managers.service';
import { getDashboardStats } from '@/services/admin.service';
import {
  getAllAssignments,
  getMyAllAssignments,
  getMyAssignments,
} from '@/services/assignments.service';
import { getAtsClients, getAtsTeam, getAtsVAs } from '@/services/ats.service';
import {
  getClientAccounts,
  getHiredVasForClient,
  getProvisionedClients,
} from '@/services/client-accounts.service';
import {
  getEodSubmission,
  getEodSubmissions,
} from '@/services/eod-submissions.service';
import { getAtsJobs } from '@/services/jobs.service';
import {
  getReview,
  getReviews,
  type IReviewFilters,
} from '@/services/performance-reviews.service';
import { getScorecards } from '@/services/scorecards.service';
import { getSurveyReminders } from '@/services/survey-reminders.service';
import { getVaProfiles } from '@/services/va-profiles.service';
import { getWorkEntries } from '@/services/work-entries.service';
import { useQuery } from '@tanstack/react-query';

/** Return the current user's ID, scoped per login session to prevent cache pollution. */
function useUserId(): string | undefined {
  return useAppSelector(s => s.auth.user?.id);
}

export const QK = {
  workEntries: (uid?: string) => ['work-entries', uid ?? 'anon'] as const,
  eodSubmissions: (uid?: string) => ['eod-submissions', uid ?? 'anon'] as const,
  myAssignments: (uid?: string) =>
    ['assignments', 'my', uid ?? 'anon'] as const,
  myAllAssignments: (uid?: string) =>
    ['assignments', 'my-all', uid ?? 'anon'] as const,
  allAssignments: (uid?: string) =>
    ['assignments', 'all', uid ?? 'anon'] as const,
  atsVAs: ['ats', 'vas'] as const,
  atsClients: ['ats', 'clients'] as const,
  atsTeam: ['ats', 'team'] as const,
  atsJobs: ['ats', 'jobs'] as const,
  accountManagers: ['account-managers'] as const,
  activeAccountManagers: ['account-managers', 'active'] as const,
  crmVaUsers: ['crm-users', 'va'] as const,
  crmClientUsers: ['crm-users', 'client'] as const,
  crmAdminUsers: ['crm-users', 'admin'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  surveyReminders: ['survey-reminders'] as const,
  clientAccounts: ['client-accounts'] as const,
  provisionedClients: ['client-accounts', 'provisioned'] as const,
  vaProfiles: ['va-profiles'] as const,
  scorecards: (vaId?: string) => ['scorecards', vaId ?? 'all'] as const,
  hiredVasForClient: (clientId?: string) =>
    ['hired-vas', clientId ?? 'none'] as const,
  eodSubmission: (id: string) => ['eod-submission', id] as const,
  performanceReviews: (filters?: IReviewFilters) =>
    ['performance-reviews', filters ?? {}] as const,
  performanceReview: (id: string) => ['performance-reviews', id] as const,
};

export function useWorkEntriesQuery(filters?: {
  candidateId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const uid = useUserId();
  return useQuery({
    queryKey: [...QK.workEntries(uid), filters ?? {}],
    queryFn: () => getWorkEntries(filters),
    enabled: !!uid,
  });
}

export function useEodSubmissionsQuery(filters?: {
  candidateId?: string;
  clientId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const uid = useUserId();
  return useQuery({
    queryKey: [...QK.eodSubmissions(uid), filters ?? {}],
    queryFn: () => getEodSubmissions(filters),
    enabled: !!uid,
  });
}

export function useEodSubmissionQuery(id?: string) {
  return useQuery({
    queryKey: QK.eodSubmission(id ?? 'none'),
    queryFn: () => getEodSubmission(id!),
    enabled: !!id,
  });
}

export function useMyAssignmentsQuery() {
  const uid = useUserId();
  return useQuery({
    queryKey: QK.myAssignments(uid),
    queryFn: () => getMyAssignments(),
    enabled: !!uid,
  });
}

export function useMyAllAssignmentsQuery() {
  const uid = useUserId();
  return useQuery({
    queryKey: QK.myAllAssignments(uid),
    queryFn: () => getMyAllAssignments(),
    enabled: !!uid,
  });
}

export function useAllAssignmentsQuery(accountManagerId?: string) {
  const uid = useUserId();
  return useQuery({
    queryKey: [...QK.allAssignments(uid), accountManagerId ?? 'all'],
    queryFn: () =>
      getAllAssignments(accountManagerId ? { accountManagerId } : {}),
    enabled: !!uid,
  });
}

export function useAtsVAsQuery() {
  return useQuery({ queryKey: QK.atsVAs, queryFn: getAtsVAs });
}

export function useAtsClientsQuery() {
  return useQuery({ queryKey: QK.atsClients, queryFn: getAtsClients });
}

export function useAtsTeamQuery() {
  return useQuery({ queryKey: QK.atsTeam, queryFn: getAtsTeam });
}

export function useAtsJobsQuery() {
  return useQuery({ queryKey: QK.atsJobs, queryFn: getAtsJobs });
}

export function useAccountManagersQuery() {
  return useQuery({
    queryKey: QK.accountManagers,
    queryFn: () => getAccountManagers(),
  });
}

export function useActiveAccountManagersQuery() {
  return useQuery({
    queryKey: QK.activeAccountManagers,
    queryFn: () => getAccountManagers(true),
  });
}

export function useCrmVaUsersQuery() {
  return useQuery({
    queryKey: QK.crmVaUsers,
    queryFn: () => getCrmUsersByRole('va'),
  });
}

export function useCrmClientUsersQuery() {
  return useQuery({
    queryKey: QK.crmClientUsers,
    queryFn: () => getCrmUsersByRole('client'),
  });
}

export function useCrmAdminUsersQuery() {
  return useQuery({
    queryKey: QK.crmAdminUsers,
    queryFn: () => getCrmUsersByRole('admin'),
  });
}

export function useDashboardStatsQuery() {
  return useQuery({ queryKey: QK.dashboardStats, queryFn: getDashboardStats });
}

export function useSurveyRemindersQuery() {
  return useQuery({
    queryKey: QK.surveyReminders,
    queryFn: getSurveyReminders,
  });
}

export function useClientAccountsQuery() {
  return useQuery({ queryKey: QK.clientAccounts, queryFn: getClientAccounts });
}

export function useProvisionedClientsQuery() {
  return useQuery({
    queryKey: QK.provisionedClients,
    queryFn: getProvisionedClients,
  });
}

export function useHiredVasForClientQuery(clientId?: string) {
  return useQuery({
    queryKey: QK.hiredVasForClient(clientId),
    queryFn: () => getHiredVasForClient(clientId!),
    enabled: !!clientId,
  });
}

export function useVaProfilesQuery() {
  return useQuery({ queryKey: QK.vaProfiles, queryFn: getVaProfiles });
}

export function useScorecardsQuery(vaId?: string) {
  return useQuery({
    queryKey: QK.scorecards(vaId),
    queryFn: () => getScorecards(vaId),
  });
}

export function usePerformanceReviewsQuery(filters?: IReviewFilters) {
  return useQuery({
    queryKey: QK.performanceReviews(filters),
    queryFn: () => getReviews(filters),
  });
}

export function usePerformanceReviewQuery(id: string) {
  return useQuery({
    queryKey: QK.performanceReview(id),
    queryFn: () => getReview(id),
    enabled: !!id,
  });
}
