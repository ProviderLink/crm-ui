import { MailIcon } from 'lucide-react';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import {
  ActiveBadge,
  InitialsTile,
  RoleBadge,
} from '@/components/shared/badges';

import { ClientProfileSection } from './ClientProfileSection';
import type { UserRow } from './types';
import { VaProfileSection } from './VaProfileSection';

export function UserDetailSheet({
  user,
  open,
  onClose,
}: {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;

  const isClient = user.role === 'client' && !!user.clientRef;
  const isVa = user.role === 'va';
  const showCrmProfile = isClient || isVa;
  const title = isClient ? (user.companyName ?? user.name) : user.name;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={o => !o && onClose()}
      srTitle="Account details"
      srDescription={
        showCrmProfile ? 'CRM account profile' : 'Read-only account view'
      }
    >
      <DrawerHeader className="items-start">
        <InitialsTile name={title} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">{title}</h2>
            <RoleBadge role={user.role} />
            <ActiveBadge active={user.isActive} />
          </div>
          {!isClient && (
            <a
              href={`mailto:${user.email}`}
              className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <MailIcon className="size-3.5 shrink-0" />
              {user.email}
            </a>
          )}
        </div>
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-6">
        {isClient && <ClientProfileSection clientId={user.clientRef!} />}
        {isVa && <VaProfileSection vaId={user.candidateRef} />}
        {!showCrmProfile && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold">Account info</p>
            <p className="text-sm text-muted-foreground">
              Internal staff accounts do not have a separate CRM profile. Manage
              access and roles in the ATS system.
            </p>
          </div>
        )}
      </div>
    </DetailDrawer>
  );
}
