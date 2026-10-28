import { SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/store';

import {
  buildAdminColumns,
  buildAmColumns,
  buildClientColumns,
  buildVaColumns,
} from './accounts/columns';
import { UserDetailSheet } from './accounts/UserDetailSheet';
import type { UserRow } from './accounts/types';
import { useAccountRows } from './accounts/use-account-rows';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

type TabKey = 'clients' | 'vas' | 'ams' | 'admins';

const rowText = (r: UserRow) =>
  `${r.name} ${r.email} ${r.companyName ?? ''} ${r.primaryContactName ?? ''}`.toLowerCase();

export default function AccountManagementPage() {
  const authUser = useAppSelector(s => s.auth.user);
  const isAccountManager = authUser?.role === 'account_manager';
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [tab, setTab] = useState<TabKey>('clients');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { clientRows, vaRows, amRows, adminRows, isLoading } =
    useAccountRows();

  const query = search.trim().toLowerCase();
  const filter = (rows: UserRow[]) =>
    rows.filter(
      r =>
        (status === 'all' || r.isActive === (status === 'active')) &&
        (!query || rowText(r).includes(query))
    );
  const clients = filter(clientRows);
  const vas = filter(vaRows);
  const ams = filter(amRows);
  const admins = filter(adminRows);
  const shown = { clients, vas, ams, admins }[tab].length;
  const filtered = search !== '' || status !== 'all';

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'clients', label: 'Clients', count: clientRows.length },
    { key: 'vas', label: 'Virtual Assistants', count: vaRows.length },
    ...(isAccountManager
      ? []
      : [
          {
            key: 'ams' as const,
            label: 'Account Managers',
            count: amRows.length,
          },
          { key: 'admins' as const, label: 'Admins', count: adminRows.length },
        ]),
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAccountManager
              ? 'View your assigned clients and virtual assistants'
              : 'View who has CRM access. Manage roles and access from the ATS.'}
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
            <TabsList className={TAB_LIST}>
              {tabs.map(t => (
                <TabsTrigger key={t.key} value={t.key} className={TAB}>
                  {t.label}
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {t.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search + status filter, applied to whichever tab is open */}
            <div className="my-4 flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email or company…"
                  aria-label="Search accounts"
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <Select
                value={status}
                onValueChange={v => setStatus(v as typeof status)}
              >
                <SelectTrigger
                  className="h-8 w-36 text-sm"
                  aria-label="Filter by status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {shown} account{shown !== 1 ? 's' : ''}
              </span>
            </div>

            <TabsContent value="clients" className="mt-0">
              <DataTable
                columns={buildClientColumns()}
                data={clients}
                isLoading={isLoading}
                onRowClick={setDetailUser}
              />
            </TabsContent>
            <TabsContent value="vas" className="mt-0">
              <DataTable
                columns={buildVaColumns()}
                data={vas}
                isLoading={isLoading}
                onRowClick={setDetailUser}
              />
            </TabsContent>
            {!isAccountManager && (
              <>
                <TabsContent value="ams" className="mt-0">
                  <DataTable
                    columns={buildAmColumns()}
                    data={ams}
                    isLoading={isLoading}
                  />
                </TabsContent>
                <TabsContent value="admins" className="mt-0">
                  <DataTable
                    columns={buildAdminColumns()}
                    data={admins}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </>
            )}
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
