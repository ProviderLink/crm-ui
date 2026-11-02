import { useState } from 'react';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  DateRangeFilter,
  SearchInput,
} from '@/components/shared/FilterControls';
import { StatTile } from '@/components/shared/StatTile';
import { EodDetailSheet } from '@/features/eod/EodDetailSheet';
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
import { formatMinutes } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry } from '@/types/work-entry';

import { WorkEntryDrawer } from '@/features/work-entries/WorkEntryDrawer';
import { useWorkActivity } from './work-activity/use-work-activity';

type TabKey = 'work' | 'eod';

export default function WorkActivityPage() {
  const w = useWorkActivity();
  const [tab, setTab] = useState<TabKey>('work');
  const [openEntry, setOpenEntry] = useState<IWorkEntry | null>(null);
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  const totalMinutes = w.filteredEntries.reduce((s, e) => s + e.timeSpent, 0);
  const shown =
    tab === 'work' ? w.filteredEntries.length : w.filteredEods.length;
  const countLabel =
    tab === 'work'
      ? `${shown} entr${shown === 1 ? 'y' : 'ies'}`
      : `${shown} report${shown === 1 ? '' : 's'}`;

  return (
    <Page
      overlays={
        <>
          <WorkEntryDrawer
            entry={openEntry}
            vaName={
              openEntry
                ? (w.vaMap.get(openEntry.candidateId) ?? openEntry.candidateId)
                : ''
            }
            clientName={
              openEntry
                ? (w.clientMap.get(openEntry.clientId) ?? openEntry.clientId)
                : ''
            }
            service={
              openEntry
                ? w.assignmentMap.get(openEntry.assignmentId)
                : undefined
            }
            onClose={() => setOpenEntry(null)}
          />

          <EodDetailSheet
            eodId={openEod?._id ?? null}
            fallback={openEod}
            reportName="daily report"
            onOpenChange={open => !open && setOpenEod(null)}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Work Activity"
          description="Your VAs’ work entries and daily reports"
        />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={w.search}
            onChange={w.setSearch}
            placeholder="Search VA or task…"
            label="Search work activity"
            className="sm:w-64"
          />

          {w.multipleAssignments && (
            <Select
              value={w.assignmentFilter}
              onValueChange={w.setAssignmentFilter}
            >
              <SelectTrigger
                className="h-8 w-56 text-sm"
                aria-label="Filter by VA"
              >
                <SelectValue placeholder="All VAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAs</SelectItem>
                {w.assignments.map(a => (
                  <SelectItem key={a._id} value={a._id}>
                    {w.assignmentLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DateRangeFilter
            from={w.dateFrom}
            to={w.dateTo}
            onFromChange={w.setDateFrom}
            onToChange={w.setDateTo}
          />

          {w.hasActiveFilters && (
            <ClearFiltersButton onClick={w.clearFilters} />
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {w.isLoading ? '' : countLabel}
          </span>
        </div>

        {/* The selected period in numbers */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatTile
            size="md"
            label="Time logged"
            value={w.isLoading ? '…' : formatMinutes(totalMinutes)}
          />
          <StatTile
            size="md"
            label="Work entries"
            value={w.isLoading ? '…' : w.filteredEntries.length}
          />
          <StatTile
            size="md"
            label="Daily reports"
            value={w.isLoading ? '…' : w.filteredEods.length}
          />
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
          <UnderlineTabsList>
            <UnderlineTab value="work">
              Work entries
              {!w.isLoading && <TabCount>{w.filteredEntries.length}</TabCount>}
            </UnderlineTab>
            <UnderlineTab value="eod">
              Daily reports
              {!w.isLoading && <TabCount>{w.filteredEods.length}</TabCount>}
            </UnderlineTab>
          </UnderlineTabsList>

          <div className="mt-4" />

          <TabsContent value="work" className="mt-0">
            <DataTable
              columns={w.workColumns}
              data={w.filteredEntries}
              isLoading={w.isLoading}
              isError={!!w.entriesError}
              error={w.entriesError}
              onRowClick={setOpenEntry}
            />
          </TabsContent>

          <TabsContent value="eod" className="mt-0">
            <DataTable
              columns={w.eodColumns}
              data={w.filteredEods}
              isLoading={w.isLoading}
              isError={!!w.eodsError}
              error={w.eodsError}
              onRowClick={setOpenEod}
            />
          </TabsContent>
        </Tabs>
      </PageSection>
    </Page>
  );
}
