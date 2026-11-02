import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
  useClientAccountsQuery,
  useCrmVaUsersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useRole } from '@/hooks/use-role';
import type { IAssignment } from '@/types/assignment';

type NameMap = Record<string, string>;

/**
 * The assignments the caller may see: everyone's for an admin, the manager's
 * own for an account manager. They carry the VA and company names already, so
 * names need no separate (and capped) ATS lists.
 */
function useVisibleAssignments(): IAssignment[] {
  const user = useAppSelector(s => s.auth.user);
  const { isAccountManager } = useRole();
  const { data = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  return data;
}

/**
 * VA names by id. Assignments are the main source (they carry the candidate's
 * name and id); CRM VA users fill in by candidate link or user id.
 */
export function useVaNames(): NameMap {
  const assignments = useVisibleAssignments();
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  return useMemo(() => {
    const names: NameMap = {};
    for (const a of assignments)
      if (a.candidateName) names[a.candidateId] = a.candidateName;
    for (const v of crmVAs) {
      const name = `${v.firstName} ${v.lastName}`;
      if (v.candidateRef && !names[v.candidateRef])
        names[v.candidateRef] = name;
      if (v._id && !names[v._id]) names[v._id] = name;
    }
    return names;
  }, [assignments, crmVAs]);
}

/** Client company names by id: from assignments, then client profiles. */
export function useClientNames(): NameMap {
  const assignments = useVisibleAssignments();
  const { data: accounts = [] } = useClientAccountsQuery();
  return useMemo(() => {
    const names: NameMap = {};
    for (const a of assignments)
      if (a.companyName) names[a.clientId] = a.companyName;
    for (const c of accounts)
      if (c.companyName && !names[c.clientId])
        names[c.clientId] = c.companyName;
    return names;
  }, [assignments, accounts]);
}

/** Service type (what the VA does for the client) by assignment id. */
export function useServiceNames(assignments: IAssignment[]): NameMap {
  return useMemo(() => {
    const names: NameMap = {};
    for (const a of assignments) names[a._id] = a.serviceType ?? 'VA Service';
    return names;
  }, [assignments]);
}
