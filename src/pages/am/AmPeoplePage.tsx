import { SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { UserRow } from '../admin/accounts/types';
import { UserDetailSheet } from '../admin/accounts/UserDetailSheet';
import { useAccountRows } from '../admin/accounts/use-account-rows';
import {
  attentionScore,
  buildAmClientColumns,
  buildAmVaColumns,
} from './people/columns';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">People</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The clients and VAs you look after
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="clients" className={TAB}>
                Clients
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {clientRows.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="vas" className={TAB}>
                Virtual Assistants
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {vaRows.length}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Search and filters, applied to whichever tab is open */}
            <div className="my-4 flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email or company…"
                  aria-label="Search people"
                  className="h-8 pl-8 text-sm"
                />
              </div>
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
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatus('active');
                    setAtRiskOnly(false);
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                  Clear
                </button>
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
