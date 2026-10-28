import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { DataTable } from '@/components/shared/DataTable';

import { buildEodColumns } from './eod-reports/columns';
import { EodFilters } from './eod-reports/EodFilters';
import { useEodReports } from './eod-reports/use-eod-reports';

export default function EodReportsPage() {
  const r = useEodReports();

  const columns = buildEodColumns({
    vaMap: r.vaMap,
    clientMap: r.clientMap,
    assignmentMap: r.assignmentMap,
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              EOD Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {r.isAccountManager
                ? 'EOD submissions for your assigned VAs'
                : 'All VA EOD submissions across clients'}
            </p>
          </div>

          <EodFilters
            search={r.search}
            onSearchChange={r.setSearch}
            dateFrom={r.dateFrom}
            onDateFromChange={r.setDateFrom}
            dateTo={r.dateTo}
            onDateToChange={r.setDateTo}
            hasFilter={r.hasFilter}
            onClear={r.clearFilters}
            exportFormat={r.exportFormat}
            onExportFormatChange={r.setExportFormat}
            onExport={r.handleExport}
            exporting={r.exporting}
            exportRangeValid={r.exportRangeValid}
            exportError={r.exportError}
            recordCount={r.eods.length}
          />

          <DataTable
            columns={columns}
            data={r.eods}
            isLoading={r.isLoading}
            isError={r.isError}
            error={r.error}
            onRowClick={eod => {
              r.setSelectedEodId(eod._id);
              r.setSelectedEodFallback(eod);
            }}
          />
        </div>
      </div>

      <EodDetailSheet
        eodId={r.selectedEodId}
        fallback={r.selectedEodFallback}
        onOpenChange={open => {
          if (!open) {
            r.setSelectedEodId(null);
            r.setSelectedEodFallback(null);
          }
        }}
      />
    </div>
  );
}
