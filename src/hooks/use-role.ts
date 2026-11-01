import { useAppSelector } from '@/hooks/store';

/** What the signed-in user's role allows, so pages ask a question, not compare strings. */
export function useRole() {
  const role = useAppSelector(s => s.auth.user?.role);
  return {
    role,
    isAdmin: role === 'admin',
    isAccountManager: role === 'account_manager',
    isVa: role === 'va',
    isClient: role === 'client',
    /** Admins and account managers: the people who run the accounts. */
    isStaff: role === 'admin' || role === 'account_manager',
  };
}
