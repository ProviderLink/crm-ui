import { DownloadIcon, SearchIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
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
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search VA or client…"
            aria-label="Search by VA or client"
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* The same range drives the table and the export. */}
        <div className="flex items-center gap-1.5">
          <DatePickerField value={dateFrom} onChange={onDateFromChange} />
          <span className="text-xs text-muted-foreground">to</span>
          <DatePickerField value={dateTo} onChange={onDateToChange} />
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            Clear
          </button>
        )}

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
