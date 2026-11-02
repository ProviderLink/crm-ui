import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useClientNames, useVaNames } from './use-name-maps';

const state = vi.hoisted(() => ({
  assignments: [] as unknown[],
  vaUsers: [] as unknown[],
  accounts: [] as unknown[],
}));

vi.mock('@/hooks/queries', () => ({
  useAllAssignmentsQuery: () => ({ data: state.assignments }),
  useCrmVaUsersQuery: () => ({ data: state.vaUsers }),
  useClientAccountsQuery: () => ({ data: state.accounts }),
}));
vi.mock('@/hooks/store', () => ({
  useAppSelector: (select: (s: unknown) => unknown) =>
    select({ auth: { user: { id: 'am1' } } }),
}));
vi.mock('@/hooks/use-role', () => ({
  useRole: () => ({ isAccountManager: false }),
}));

describe('name maps', () => {
  it('names VAs from assignments first, then from CRM users', () => {
    state.assignments = [{ candidateId: 'c1', candidateName: 'Ayesha Rahman' }];
    state.vaUsers = [
      { _id: 'u2', candidateRef: 'c2', firstName: 'Tomas', lastName: 'Novak' },
      { _id: 'u1', candidateRef: 'c1', firstName: 'Other', lastName: 'Name' },
    ];
    const { result } = renderHook(() => useVaNames());
    expect(result.current).toMatchObject({
      c1: 'Ayesha Rahman',
      c2: 'Tomas Novak',
      u2: 'Tomas Novak',
    });
  });

  it('names clients from assignments, then from client profiles', () => {
    state.assignments = [{ clientId: 'k1', companyName: 'Sunrise Clinic' }];
    state.accounts = [
      { clientId: 'k1', companyName: 'Ignored' },
      { clientId: 'k2', companyName: 'Harbor Health' },
    ];
    const { result } = renderHook(() => useClientNames());
    expect(result.current).toEqual({
      k1: 'Sunrise Clinic',
      k2: 'Harbor Health',
    });
  });
});
