import { useRole } from '@/hooks/use-role';
import {
  useAccountManagersQuery,
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useClientAccountsQuery,
  useCrmAccountsListQuery,
  useCrmAdminUsersQuery,
  useVaProfilesQuery,
} from '@/hooks/queries';
import type { IAccountManager, ICrmUser } from '@/types/user';

import type { UserRow } from './types';

function toRow(u: ICrmUser | IAccountManager): UserRow {
  const roles = u.roles ?? [];
  return {
    id: u.id ?? u._id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: roles[0] ?? 'unknown',
    isActive: u.isActive,
    clientRef: (u as ICrmUser).clientRef,
    candidateRef: (u as ICrmUser).candidateRef,
  };
}

export function useAccountRows() {
  // Fetch CRM client & VA users via the self-scoped /shared/users/crm-accounts
  // endpoint. The backend scopes results to the caller's assignments for AMs
  // (so AMs don't need the team.read permission just to see their accounts).
  // AM users and admin users are still fetched from /shared/users (admins only,
  // gated by team.read server-side, but AM-tabs aren't shown to AMs anyway).
  const crmAccountsQuery = useCrmAccountsListQuery();
  const { data: crmAccounts, isLoading: loadingCrmAccounts } = crmAccountsQuery;
  const vaUsers = crmAccounts?.vas ?? [];
  const clientUsers = crmAccounts?.clients ?? [];

  // The AM and admin tabs are admin-only, and account managers cannot list
  // users, so skip those requests for them.
  const { isAccountManager } = useRole();
  const canListUsers = !isAccountManager;
  const amQuery = useAccountManagersQuery(canListUsers);
  const { data: amUsers = [], isLoading: loadingAm } = amQuery;
  const adminQuery = useCrmAdminUsersQuery(canListUsers);
  const { data: adminUsers = [], isLoading: loadingAdmin } = adminQuery;

  const adminRows: UserRow[] = adminUsers.map(toRow);

  const { data: vaProfiles = [] } = useVaProfilesQuery();

  // All assignments in one request, so VAs can be counted without N+1 calls.
  const { data: allAssignmentsData } = useAllAssignmentsQuery();

  const vaProfileByVaId = Object.fromEntries(vaProfiles.map(p => [p.vaId, p]));

  const assignmentsByCandidate: Record<
    string,
    { activeClients: Set<string>; total: number }
  > = {};
  for (const a of allAssignmentsData ?? []) {
    const cid = a.candidateId;
    if (!assignmentsByCandidate[cid])
      assignmentsByCandidate[cid] = { activeClients: new Set(), total: 0 };
    assignmentsByCandidate[cid].total++;
    if (a.status === 'active')
      assignmentsByCandidate[cid].activeClients.add(a.clientId);
  }

  // The /shared/users/crm-accounts endpoint already scopes clients and VAs
  // for AMs server-side, so no additional client-side AM filtering is needed.
  const vaRows: UserRow[] = vaUsers.map(u => {
    const row = toRow(u);
    const profile = row.candidateRef
      ? vaProfileByVaId[row.candidateRef]
      : undefined;
    const counts = row.candidateRef
      ? assignmentsByCandidate[row.candidateRef]
      : undefined;
    return {
      ...row,
      vaWorkload: profile?.workloadLevel ?? null,
      vaActiveClients: counts?.activeClients.size ?? 0,
      vaTotalAssignments: counts?.total ?? 0,
      vaBurnoutRisk: profile?.burnoutRiskFlag ?? false,
      vaReplacementRisk: profile?.replacementRiskFlag ?? false,
      vaSatisfactionScore: profile?.satisfactionScore ?? null,
      lastCheckin: profile?.lastVaCheckin ?? null,
    };
  });

  // Count active assignments per account manager
  const activeByAm: Record<string, number> = {};
  for (const a of allAssignmentsData ?? []) {
    if (a.status === 'active' && a.accountManagerId) {
      activeByAm[a.accountManagerId] =
        (activeByAm[a.accountManagerId] ?? 0) + 1;
    }
  }

  const amRows: UserRow[] = amUsers.map(u => {
    const row = toRow(u);
    return { ...row, amAssignmentCount: activeByAm[row.id] ?? 0 };
  });

  const { data: clientAccounts = [] } = useClientAccountsQuery();

  const accountByClientId = Object.fromEntries(
    clientAccounts.map(a => [a.clientId, a])
  );

  // A client only has a CRM profile (and so a row in `clientAccounts`) after
  // someone first edits it; fall back to the ATS client record for the name.
  const { data: atsClients = [] } = useAtsClientsQuery();
  const atsNameById = Object.fromEntries(
    atsClients.map(c => [c.id, c.companyName])
  );

  const clientRows: UserRow[] = clientUsers.map(u => {
    const row = toRow(u);
    const acc = row.clientRef ? accountByClientId[row.clientRef] : undefined;
    return {
      ...row,
      companyName:
        acc?.companyName ??
        (row.clientRef ? atsNameById[row.clientRef] : undefined) ??
        null,
      // The CRM user is the client's contact when no profile lists one.
      primaryContactName: acc?.primaryContact || row.name,
      primaryContactEmail: acc?.primaryContactEmail || row.email,
      healthStatus: acc?.healthStatus ?? null,
      satisfactionScore: acc?.satisfactionScore ?? null,
      lastCheckin: acc?.lastClientCheckin ?? null,
    };
  });

  return {
    clientRows,
    vaRows,
    amRows,
    adminRows,
    isLoading: loadingCrmAccounts || loadingAm || loadingAdmin,
    isError: crmAccountsQuery.isError || amQuery.isError || adminQuery.isError,
    error: crmAccountsQuery.error ?? amQuery.error ?? adminQuery.error,
  };
}
