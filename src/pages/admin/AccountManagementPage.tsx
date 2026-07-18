import type { ColumnDef } from '@tanstack/react-table';
import { EyeIcon, MailIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAccountManagers,
  getCrmUsersByRole,
  type IAccountManager,
  type ICrmUser,
} from '@/services/account-managers.service';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
    account_manager:
      'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
    va: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20',
    client:
      'bg-green-500/10 text-green-700 dark:text-green-400 ring-green-500/20',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    account_manager: 'AM',
    va: 'VA',
    client: 'Client',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[role] ?? 'bg-muted text-muted-foreground ring-border'}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-500/20">
      <span className="size-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      Inactive
    </span>
  );
}

// ─── User tables ──────────────────────────────────────────────────────────────

type UserRow = { name: string; email: string; role: string; isActive: boolean };

function buildUserColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {row.original.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => <RoleBadge role={getValue<string>()} />,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      id: 'actions',
      header: '',
      size: 50,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3.5" />
        </Button>
      ),
    },
  ];
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function UserDetailSheet({
  user,
  open,
  onClose,
}: {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;
  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Account Details</SheetTitle>
          <SheetDescription>
            Read-only view — manage access from the ATS.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
              {user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <DetailRow
              icon={<MailIcon className="size-3.5" />}
              label="Email"
              value={user.email}
            />
            <DetailRow
              icon={<ShieldCheckIcon className="size-3.5" />}
              label="Role"
              value={user.role}
            />
            <DetailRow
              icon={<UsersIcon className="size-3.5" />}
              label="Access Status"
              value={
                user.isActive
                  ? 'Active — has CRM access'
                  : 'Inactive — no CRM access'
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-sm">{value}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountManagementPage() {
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const { data: vaUsers = [], isLoading: loadingVa } = useQuery({
    queryKey: ['shared-users', 'va'],
    queryFn: () => getCrmUsersByRole('va'),
  });
  const { data: clientUsers = [], isLoading: loadingClient } = useQuery({
    queryKey: ['shared-users', 'client'],
    queryFn: () => getCrmUsersByRole('client'),
  });
  const { data: amUsers = [], isLoading: loadingAm } = useQuery({
    queryKey: ['shared-users', 'am'],
    queryFn: () => getAccountManagers(),
  });
  const { data: adminUsers = [], isLoading: loadingAdmin } = useQuery({
    queryKey: ['shared-users', 'admin'],
    queryFn: () => getCrmUsersByRole('admin'),
  });

  function toRow(u: ICrmUser | IAccountManager): UserRow {
    return {
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
    };
  }

  const vaRows: UserRow[] = vaUsers.map(toRow);
  const clientRows: UserRow[] = clientUsers.map(toRow);
  const amRows: UserRow[] = amUsers.map(toRow);
  const adminRows: UserRow[] = adminUsers.map(toRow);

  const isLoading = loadingVa || loadingClient || loadingAm || loadingAdmin;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View who has CRM access. Manage roles and access from the ATS.
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">
                Clients ({clientRows.length})
              </TabsTrigger>
              <TabsTrigger value="vas">
                Virtual Assistants ({vaRows.length})
              </TabsTrigger>
              <TabsTrigger value="ams">
                Account Managers ({amRows.length})
              </TabsTrigger>
              <TabsTrigger value="admins">
                Admins ({adminRows.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={clientRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="vas" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={vaRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="ams" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={amRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="admins" className="mt-4">
              <DataTable
                columns={buildUserColumns(setDetailUser)}
                data={adminRows}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <UserDetailSheet
        user={detailUser}
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
      />
    </div>
  );
}
