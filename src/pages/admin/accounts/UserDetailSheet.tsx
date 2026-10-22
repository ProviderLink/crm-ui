import { MailIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { RoleBadge, ActiveBadge } from './badges';
import { type UserRow } from './types';
import { ClientProfileSection } from './ClientProfileSection';
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

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-0">
        {/* Hero header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="sr-only">Account Details</SheetTitle>
          <SheetDescription className="sr-only">
            {showCrmProfile ? 'CRM account profile' : 'Read-only account view'}
          </SheetDescription>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-text-secondary font-mono text-base font-medium border border-white/[0.08]">
              {isClient
                ? (user.companyName ?? user.name)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              {isClient ? (
                <>
                  <p className="text-base font-semibold leading-tight truncate">
                    {user.companyName ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <RoleBadge role={user.role} />
                    <ActiveBadge active={user.isActive} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-semibold leading-tight">
                      {user.name}
                    </p>
                    <RoleBadge role={user.role} />
                  </div>
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    <MailIcon className="size-3 shrink-0" />
                    {user.email}
                  </a>
                  <div className="mt-2">
                    <ActiveBadge active={user.isActive} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {isClient && <ClientProfileSection clientId={user.clientRef!} />}
          {isVa && <VaProfileSection vaId={user.candidateRef} />}
          {!showCrmProfile && (
            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Account Info
              </p>
              <p className="text-xs text-muted-foreground">
                Internal staff accounts do not have a separate CRM profile.
                Manage access and roles in the ATS system.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
