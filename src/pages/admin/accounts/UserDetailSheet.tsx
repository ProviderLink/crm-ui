import { MailIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';

import { ActiveBadge, Avatar, RoleBadge } from './badges';
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
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side="right"
        // Floats with a gap to the viewport; the built-in close button is
        // hidden in favour of the one below, outside the drawer's top-left.
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-lg [&>button:last-child]:hidden"
      >
        <SheetTitle className="sr-only">Account details</SheetTitle>
        <SheetDescription className="sr-only">
          {showCrmProfile ? 'CRM account profile' : 'Read-only account view'}
        </SheetDescription>

        {/* Beside the drawer's top-left corner when there is room; inside
            its top-right corner on narrow screens. */}
        <SheetClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Close"
            className="absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised min-[700px]:-left-11 min-[700px]:right-auto min-[700px]:top-0"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetClose>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          <header className="flex items-start gap-3 border-b border-border px-6 py-4 pr-14 min-[700px]:pr-6">
            <Avatar name={title} />
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
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-6">
            {isClient && <ClientProfileSection clientId={user.clientRef!} />}
            {isVa && <VaProfileSection vaId={user.candidateRef} />}
            {!showCrmProfile && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold">Account info</p>
                <p className="text-sm text-muted-foreground">
                  Internal staff accounts do not have a separate CRM profile.
                  Manage access and roles in the ATS system.
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
