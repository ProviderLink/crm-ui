import type { UserRole } from '@/types/auth';

/** Landing page of each portal, keyed by role. */
export const roleHome: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/am/dashboard',
  va: '/va/dashboard',
  client: '/client/dashboard',
};
