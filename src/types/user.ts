/** A user as the shared users endpoints return them. */
export interface IAccountManager {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  phone?: string;
  atsId?: string;
  lastLogin?: string;
  createdAt?: string;
}

/** A CRM account (client contact or VA) with its links to ATS records. */
export interface ICrmUser extends IAccountManager {
  emailVerified: boolean;
  clientRef?: string | null;
  candidateRef?: string | null;
  isInviteAccepted?: boolean;
}
