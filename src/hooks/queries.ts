import { getDashboardStats } from '@/services/admin.service'
import {
  getAllAssignments,
  getMyAssignments,
} from '@/services/assignments.service'
import { getAtsClients, getAtsTeam, getAtsVAs } from '@/services/ats.service'
import { getClientAccounts } from '@/services/client-accounts.service'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getScorecards } from '@/services/scorecards.service'
import { getSurveyReminders } from '@/services/survey-reminders.service'
import { getVaProfiles } from '@/services/va-profiles.service'
import { getWorkEntries } from '@/services/work-entries.service'
import { useQuery } from '@tanstack/react-query'

export const QK = {
  workEntries: ['work-entries'] as const,
  eodSubmissions: ['eod-submissions'] as const,
  myAssignments: ['assignments', 'my'] as const,
  allAssignments: ['assignments', 'all'] as const,
  atsVAs: ['ats', 'vas'] as const,
  atsClients: ['ats', 'clients'] as const,
  atsTeam: ['ats', 'team'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  surveyReminders: ['survey-reminders'] as const,
  clientAccounts: ['client-accounts'] as const,
  vaProfiles: ['va-profiles'] as const,
  scorecards: (vaId?: string) => ['scorecards', vaId ?? 'all'] as const,
}

export function useWorkEntriesQuery() {
  return useQuery({ queryKey: QK.workEntries, queryFn: () => getWorkEntries() })
}

export function useEodSubmissionsQuery() {
  return useQuery({ queryKey: QK.eodSubmissions, queryFn: () => getEodSubmissions() })
}

export function useMyAssignmentsQuery() {
  return useQuery({
    queryKey: QK.myAssignments,
    queryFn: () =>
      getMyAssignments().then(data => data.filter(a => a.status === 'active')),
  })
}

export function useAllAssignmentsQuery() {
  return useQuery({ queryKey: QK.allAssignments, queryFn: () => getAllAssignments() })
}

export function useAtsVAsQuery() {
  return useQuery({ queryKey: QK.atsVAs, queryFn: getAtsVAs })
}

export function useAtsClientsQuery() {
  return useQuery({ queryKey: QK.atsClients, queryFn: getAtsClients })
}

export function useAtsTeamQuery() {
  return useQuery({ queryKey: QK.atsTeam, queryFn: getAtsTeam })
}

export function useDashboardStatsQuery() {
  return useQuery({ queryKey: QK.dashboardStats, queryFn: getDashboardStats })
}

export function useSurveyRemindersQuery() {
  return useQuery({ queryKey: QK.surveyReminders, queryFn: getSurveyReminders })
}

export function useClientAccountsQuery() {
  return useQuery({ queryKey: QK.clientAccounts, queryFn: getClientAccounts })
}

export function useVaProfilesQuery() {
  return useQuery({ queryKey: QK.vaProfiles, queryFn: getVaProfiles })
}

export function useScorecardsQuery(vaId?: string) {
  return useQuery({
    queryKey: QK.scorecards(vaId),
    queryFn: () => getScorecards(vaId),
  })
}
