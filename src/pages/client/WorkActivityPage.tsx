import { SearchIcon, XIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { DataTable } from '@/components/shared/DataTable';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMinutes } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry } from '@/types/work-entry';

import { WorkEntryDrawer } from '../admin/work-entries/WorkEntryDrawer';
import { useWorkActivity } from './work-activity/use-work-activity';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

type TabKey = 'work' | 'eod';

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function WorkActivityPage() {
  const w = useWorkActivity();
  const [tab, setTab] = useState<TabKey>('work');
  const [openEntry, setOpenEntry] = useState<IWorkEntry | null>(null);
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  const totalMinutes = w.filteredEntries.reduce((s, e) => s + e.timeSpent, 0);
  const shown = tab === 'work' ? w.filteredEntries.length : w.filteredEods.length;
  const countLabel =
    tab === 'work'
      ? `${shown} entr${shown === 1 ? 'y' : 'ies'}`
      : `${shown} report${shown === 1 ? '' : 's'}`;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Work Activity
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your VAs’ work entries and daily reports
            </p>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={w.search}
                onChange={e => w.setSearch(e.target.value)}
                placeholder="Search VA or task…"
                aria-label="Search work activity"
                className="h-8 pl-8 text-sm"
              />
            </div>

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

            <div className="flex items-center gap-1.5">
              <DatePickerField value={w.dateFrom} onChange={w.setDateFrom} />
              <span className="text-xs text-muted-foreground">to</span>
              <DatePickerField value={w.dateTo} onChange={w.setDateTo} />
            </div>

            {w.hasActiveFilters && (
              <button
                type="button"
                onClick={w.clearFilters}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Clear
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {w.isLoading ? '' : countLabel}
            </span>
          </div>

          {/* The selected period in numbers */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Stat
              label="Time logged"
              value={w.isLoading ? '…' : formatMinutes(totalMinutes)}
            />
            <Stat
              label="Work entries"
              value={w.isLoading ? '…' : w.filteredEntries.length}
            />
            <Stat
              label="Daily reports"
              value={w.isLoading ? '…' : w.filteredEods.length}
            />
          </div>

          <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="work" className={TAB}>
                Work entries
                {!w.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {w.filteredEntries.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="eod" className={TAB}>
                Daily reports
                {!w.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {w.filteredEods.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-4" />

            <TabsContent value="work" className="mt-0">
              <DataTable
                columns={w.workColumns}
                data={w.filteredEntries}
                isLoading={w.isLoading}
                onRowClick={setOpenEntry}
              />
            </TabsContent>

            <TabsContent value="eod" className="mt-0">
              <DataTable
                columns={w.eodColumns}
                data={w.filteredEods}
                isLoading={w.isLoading}
                onRowClick={setOpenEod}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

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
          openEntry ? w.assignmentMap.get(openEntry.assignmentId) : undefined
        }
        onClose={() => setOpenEntry(null)}
      />

      <EodDetailSheet
        eodId={openEod?._id ?? null}
        fallback={openEod}
        reportName="daily report"
        onOpenChange={open => !open && setOpenEod(null)}
      />
    </div>
  );
}
