import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { StatTile } from '@/components/shared/StatTile';
import { EodDetailSheet } from '@/features/eod/EodDetailSheet';
import { DataTable } from '@/components/shared/DataTable';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { formatMinutes } from '@/lib/time';
import { useReportExport } from '@/hooks/use-report-export';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry } from '@/types/work-entry';

import { buildEodColumns } from '@/features/eod/eod-columns';
import { buildWorkEntryColumns } from '@/features/work-entries/columns';
import { WorkEntryDrawer } from '@/features/work-entries/WorkEntryDrawer';
import { ActivityFilters, type ActivityTab } from './activity/ActivityFilters';
import { useAmActivity } from './activity/use-am-activity';

export default function AmActivityPage() {
  const a = useAmActivity();
  const [params, setParams] = useSearchParams();
  const tab: ActivityTab = params.get('tab') === 'reports' ? 'reports' : 'work';
  const [openEntry, setOpenEntry] = useState<IWorkEntry | null>(null);
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  const reportExport = useReportExport({
    dateFrom: a.dateFrom,
    dateTo: a.dateTo,
  });
  const exportRangeValid = reportExport.rangeValid;
  const exportError = reportExport.error;

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
    <Page
      overlays={
        <>
          <WorkEntryDrawer
            entry={openEntry}
            vaName={
              openEntry
                ? openEntry.candidateName ||
                  a.vaMap[openEntry.candidateId] ||
                  openEntry.candidateId
                : ''
            }
            clientName={
              openEntry
                ? openEntry.companyName ||
                  a.clientMap[openEntry.clientId] ||
                  openEntry.clientId
                : ''
            }
            service={
              openEntry ? a.assignmentMap[openEntry.assignmentId] : undefined
            }
            onClose={() => setOpenEntry(null)}
          />

          <EodDetailSheet
            eodId={openEod?._id ?? null}
            fallback={openEod}
            onOpenChange={open => !open && setOpenEod(null)}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Activity"
          description="Work entries and reports from your VAs"
        />

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
          exportFormat={reportExport.format}
          onExportFormat={reportExport.setFormat}
          onExport={() =>
            reportExport.run(tab === 'work' ? 'work_entries' : 'eod')
          }
          exporting={reportExport.exporting}
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
          <StatTile
            size="md"
            label="Time logged"
            value={a.isLoading ? '…' : formatMinutes(totalMinutes)}
          />
          <StatTile
            size="md"
            label="Work entries"
            value={a.isLoading ? '…' : a.entries.length}
          />
          <StatTile
            size="md"
            label="Reports"
            value={a.isLoading ? '…' : a.eods.length}
          />
          <StatTile
            size="md"
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
          <UnderlineTabsList>
            <UnderlineTab value="work">
              Work entries
              {!a.isLoading && <TabCount>{a.entries.length}</TabCount>}
            </UnderlineTab>
            <UnderlineTab value="reports">
              Reports
              {!a.isLoading && <TabCount>{a.eods.length}</TabCount>}
            </UnderlineTab>
          </UnderlineTabsList>

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
      </PageSection>
    </Page>
  );
}
