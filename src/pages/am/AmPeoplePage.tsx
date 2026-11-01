import { useState } from 'react';

import { Page, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
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

import type { UserRow } from '@/features/accounts/types';
import { UserDetailSheet } from '@/features/accounts/UserDetailSheet';
import { useAccountRows } from '@/features/accounts/use-account-rows';
import {
  attentionScore,
  buildAmClientColumns,
  buildAmVaColumns,
} from './people/columns';

type TabKey = 'clients' | 'vas';
type StatusFilter = 'active' | 'inactive' | 'all';

const rowText = (r: UserRow) =>
  `${r.name} ${r.email} ${r.companyName ?? ''} ${r.primaryContactName ?? ''}`.toLowerCase();

export default function AmPeoplePage() {
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [tab, setTab] = useState<TabKey>('clients');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  const { clientRows, vaRows, isLoading } = useAccountRows();

  const query = search.trim().toLowerCase();
  // Accounts that need attention come first; the rest stay in name order.
  const filter = (rows: UserRow[]) =>
    rows
      .filter(
        r =>
          (status === 'all' || r.isActive === (status === 'active')) &&
          (!atRiskOnly || attentionScore(r) > 0) &&
          (!query || rowText(r).includes(query))
      )
      .sort(
        (a, b) =>
          attentionScore(b) - attentionScore(a) ||
          (a.companyName ?? a.name).localeCompare(b.companyName ?? b.name)
      );
  const clients = filter(clientRows);
  const vas = filter(vaRows);
  const shown = tab === 'clients' ? clients.length : vas.length;
  const filtered = search !== '' || status !== 'active' || atRiskOnly;

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
        <h1 className="text-2xl font-semibold text-foreground">People</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The clients and VAs you look after
        </p>
      </PageSection>

      <PageSection>
        <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
          <UnderlineTabsList>
            <UnderlineTab value="clients">
              Clients
              <TabCount>{clientRows.length}</TabCount>
            </UnderlineTab>
            <UnderlineTab value="vas">
              Virtual Assistants
              <TabCount>{vaRows.length}</TabCount>
            </UnderlineTab>
          </UnderlineTabsList>

          {/* Search and filters, applied to whichever tab is open */}
          <div className="my-4 flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email or company…"
              label="Search people"
            />
            <Select
              value={status}
              onValueChange={v => setStatus(v as StatusFilter)}
            >
              <SelectTrigger
                className="h-8 w-36 text-sm"
                aria-label="Filter by status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={atRiskOnly}
              onClick={() => setAtRiskOnly(v => !v)}
              className={`h-8 text-sm ${atRiskOnly ? 'border-status-warning/40 text-status-warning' : ''}`}
            >
              At risk only
            </Button>
            {filtered && (
              <ClearFiltersButton
                onClick={() => {
                  setSearch('');
                  setStatus('active');
                  setAtRiskOnly(false);
                }}
              />
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {shown} {tab === 'clients' ? 'client' : 'VA'}
              {shown !== 1 ? 's' : ''}
            </span>
          </div>

          <TabsContent value="clients" className="mt-0">
            <DataTable
              columns={buildAmClientColumns()}
              data={clients}
              isLoading={isLoading}
              onRowClick={setDetailUser}
            />
          </TabsContent>
          <TabsContent value="vas" className="mt-0">
            <DataTable
              columns={buildAmVaColumns()}
              data={vas}
              isLoading={isLoading}
              onRowClick={setDetailUser}
            />
          </TabsContent>
        </Tabs>
      </PageSection>
    </Page>
  );
}
