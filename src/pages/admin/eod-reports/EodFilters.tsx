import { DownloadIcon } from 'lucide-react';

import {
  ClearFiltersButton,
  DateRangeFilter,
  SearchInput,
} from '@/components/shared/FilterControls';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExportFormat } from '@/services/reports.service';

export function EodFilters({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasFilter,
  onClear,
  exportFormat,
  onExportFormatChange,
  onExport,
  exporting,
  exportRangeValid,
  exportError,
  recordCount,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  hasFilter: boolean;
  onClear: () => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (v: ExportFormat) => void;
  onExport: () => void;
  exporting: boolean;
  exportRangeValid: boolean;
  exportError: string | null;
  recordCount: number;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search VA or client…"
          label="Search by VA or client"
          className="sm:w-64"
        />

        {/* The same range drives the table and the export. */}
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={onDateFromChange}
          onToChange={onDateToChange}
        />

        {hasFilter && <ClearFiltersButton onClick={onClear} />}

        <div className="ml-auto flex items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">
            {recordCount} report{recordCount !== 1 ? 's' : ''}
          </span>
          <Select
            value={exportFormat}
            onValueChange={v => onExportFormatChange(v as ExportFormat)}
          >
            <SelectTrigger
              className="h-8 w-24 text-sm"
              aria-label="Export format"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exporting || !exportRangeValid}
            className="h-8 gap-1.5"
          >
            <DownloadIcon className="size-3.5" />
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      </div>

      {exportError && (
        <p className="mb-4 text-xs text-destructive">{exportError}</p>
      )}
      {!exportRangeValid && dateFrom !== '' && dateTo !== '' && (
        <p className="mb-4 text-xs text-destructive">
          From date must be before or equal to To date
        </p>
      )}
    </>
  );
}
