import { useMemo } from 'react';

import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmVaUsersQuery,
} from '@/hooks/queries';
import type { IAssignment } from '@/types/assignment';

type NameMap = Record<string, string>;

/**
 * VA names by id. ATS candidates are the main source (their id is what
 * records carry); CRM VA users fill in by candidate link or user id.
 */
export function useVaNames(): NameMap {
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  return useMemo(() => {
    const names: NameMap = {};
    for (const v of atsVAs) names[v.id] = `${v.firstName} ${v.lastName}`;
    for (const v of crmVAs) {
      const name = `${v.firstName} ${v.lastName}`;
      if (v.candidateRef && !names[v.candidateRef]) names[v.candidateRef] = name;
      if (v._id && !names[v._id]) names[v._id] = name;
    }
    return names;
  }, [atsVAs, crmVAs]);
}

/** Client company names by id. */
export function useClientNames(): NameMap {
  const { data: atsClients = [] } = useAtsClientsQuery();
  return useMemo(() => {
    const names: NameMap = {};
    for (const c of atsClients) names[c.id] = c.companyName;
    return names;
  }, [atsClients]);
}

/** Service type (what the VA does for the client) by assignment id. */
export function useServiceNames(assignments: IAssignment[]): NameMap {
  return useMemo(() => {
    const names: NameMap = {};
    for (const a of assignments) names[a._id] = a.serviceType ?? 'VA Service';
    return names;
  }, [assignments]);
}
