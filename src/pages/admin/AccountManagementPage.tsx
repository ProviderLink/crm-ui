import { useState } from 'react';

import { Page, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { DataTable } from '@/components/shared/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import {
  buildAdminColumns,
  buildAmColumns,
  buildClientColumns,
  buildVaColumns,
} from '@/features/accounts/columns';
import { UserDetailSheet } from '@/features/accounts/UserDetailSheet';
import type { UserRow } from '@/features/accounts/types';
import { useAccountRows } from '@/features/accounts/use-account-rows';

type TabKey = 'clients' | 'vas' | 'ams' | 'admins';

const rowText = (r: UserRow) =>
  `${r.name} ${r.email} ${r.companyName ?? ''} ${r.primaryContactName ?? ''}`.toLowerCase();

export default function AccountManagementPage() {
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [tab, setTab] = useState<TabKey>('clients');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { clientRows, vaRows, amRows, adminRows, isLoading } = useAccountRows();

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
    { key: 'ams', label: 'Account Managers', count: amRows.length },
    { key: 'admins', label: 'Admins', count: adminRows.length },
  ];

  return (
    <Page
      overlays={
        <>
          <UserDetailSheet
            user={detailUser}
            open={detailUser !== null}
            onClose={() => setDetailUser(null)}
          />
        </>
      }
    >
      <PageSection>
        <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View who has CRM access. Manage roles and access from the ATS.
        </p>
      </PageSection>

      <PageSection>
        <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
          <UnderlineTabsList>
            {tabs.map(t => (
              <UnderlineTab key={t.key} value={t.key}>
                {t.label}
                <TabCount>{t.count}</TabCount>
              </UnderlineTab>
            ))}
          </UnderlineTabsList>

          {/* Search + status filter, applied to whichever tab is open */}
          <div className="my-4 flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email or company…"
              label="Search accounts"
            />
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
              <ClearFiltersButton
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                }}
              />
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
        </Tabs>
      </PageSection>
    </Page>
  );
}
