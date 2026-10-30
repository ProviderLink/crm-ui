import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { DataTable } from '@/components/shared/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMinutes } from '@/lib/time';
import { exportReport, type ExportFormat } from '@/services/reports.service';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry } from '@/types/work-entry';

import { buildEodColumns } from '../admin/eod-reports/columns';
import { buildWorkEntryColumns } from '../admin/work-entries/columns';
import { WorkEntryDrawer } from '../admin/work-entries/WorkEntryDrawer';
import { ActivityFilters, type ActivityTab } from './activity/ActivityFilters';
import { useAmActivity } from './activity/use-am-activity';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

function Stat({
  label,
  value,
  alert,
}: {
  label: string;
  value: ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-xl font-semibold tabular-nums ${alert ? 'text-status-warning' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AmActivityPage() {
  const a = useAmActivity();
  const [params, setParams] = useSearchParams();
  const tab: ActivityTab = params.get('tab') === 'reports' ? 'reports' : 'work';
  const [openEntry, setOpenEntry] = useState<IWorkEntry | null>(null);
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRangeValid =
    a.dateFrom !== '' && a.dateTo !== '' && a.dateFrom <= a.dateTo;

  async function handleExport() {
    if (!exportRangeValid) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportReport(
        tab === 'work' ? 'work_entries' : 'eod',
        a.dateFrom,
        a.dateTo,
        exportFormat
      );
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const workColumns = buildWorkEntryColumns({
    vaMap: a.vaMap,
    clientMap: a.clientMap,
    assignmentMap: a.assignmentMap,
  });
  const eodColumns = buildEodColumns({
    vaMap: a.vaMap,
    clientMap: a.clientMap,
    assignmentMap: a.assignmentMap,
  });

  const totalMinutes = a.entries.reduce((s, e) => s + e.timeSpent, 0);
  const count =
    tab === 'work'
      ? `${a.entries.length} entr${a.entries.length === 1 ? 'y' : 'ies'}`
      : `${a.eods.length} report${a.eods.length === 1 ? '' : 's'}`;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Work entries and reports from your VAs
            </p>
          </div>

          <ActivityFilters
            tab={tab}
            search={a.search}
            onSearch={a.setSearch}
            assignments={a.assignments}
            assignmentId={a.assignmentId}
            onAssignment={a.setAssignmentId}
            status={a.status}
            onStatus={a.setStatus}
            category={a.category}
            onCategory={a.setCategory}
            blockersOnly={a.blockersOnly}
            onBlockersOnly={a.setBlockersOnly}
            dateFrom={a.dateFrom}
            onDateFrom={a.setDateFrom}
            dateTo={a.dateTo}
            onDateTo={a.setDateTo}
            hasFilter={a.hasFilter}
            onClear={a.clearFilters}
            countLabel={a.isLoading ? '' : count}
            exportFormat={exportFormat}
            onExportFormat={setExportFormat}
            onExport={handleExport}
            exporting={exporting}
            exportRangeValid={exportRangeValid}
          />
          {exportError && (
            <p className="mb-4 text-xs text-destructive">{exportError}</p>
          )}
          {!exportRangeValid && a.dateFrom !== '' && a.dateTo !== '' && (
            <p className="mb-4 text-xs text-destructive">
              From date must be before or equal to To date
            </p>
          )}

          {/* The selected period in numbers */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Time logged"
              value={a.isLoading ? '…' : formatMinutes(totalMinutes)}
            />
            <Stat
              label="Work entries"
              value={a.isLoading ? '…' : a.entries.length}
            />
            <Stat label="Reports" value={a.isLoading ? '…' : a.eods.length} />
            <Stat
              label="Blockers"
              value={a.isLoading ? '…' : a.blockerCount}
              alert={a.blockerCount > 0}
            />
          </div>

          <Tabs
            value={tab}
            onValueChange={v =>
              setParams(v === 'reports' ? { tab: 'reports' } : {}, {
                replace: true,
              })
            }
          >
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="work" className={TAB}>
                Work entries
                {!a.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {a.entries.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className={TAB}>
                Reports
                {!a.isLoading && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {a.eods.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-4" />

            <TabsContent value="work" className="mt-0">
              <DataTable
                columns={workColumns}
                data={a.entries}
                isLoading={a.isLoading}
                isError={a.entriesError}
                error={a.entriesErr}
                onRowClick={setOpenEntry}
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <DataTable
                columns={eodColumns}
                data={a.eods}
                isLoading={a.isLoading}
                isError={a.eodsError}
                error={a.eodsErr}
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
            ? (openEntry.candidateName ||
              a.vaMap[openEntry.candidateId] ||
              openEntry.candidateId)
            : ''
        }
        clientName={
          openEntry
            ? (openEntry.companyName ||
              a.clientMap[openEntry.clientId] ||
              openEntry.clientId)
            : ''
        }
        service={openEntry ? a.assignmentMap[openEntry.assignmentId] : undefined}
        onClose={() => setOpenEntry(null)}
      />

      <EodDetailSheet
        eodId={openEod?._id ?? null}
        fallback={openEod}
        onOpenChange={open => !open && setOpenEod(null)}
      />
    </div>
  );
}
