import { DownloadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExportFormat } from '@/services/reports.service';

interface VaOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClientOption {
  id: string;
  companyName: string;
}

export function EodFilters({
  vas,
  clients,
  vaFilter,
  onVaChange,
  clientFilter,
  onClientChange,
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
  vas: VaOption[];
  clients: ClientOption[];
  vaFilter: string;
  onVaChange: (v: string) => void;
  clientFilter: string;
  onClientChange: (v: string) => void;
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
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={vaFilter} onValueChange={onVaChange}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All VAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAs</SelectItem>
                {vas.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.firstName} {v.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={onClientChange}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <DatePickerField
                value={dateFrom}
                onChange={onDateFromChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={dateTo} onChange={onDateToChange} />
            </div>

            {hasFilter && (
              <button
                onClick={onClear}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}

            <Select
              value={exportFormat}
              onValueChange={v => onExportFormatChange(v as ExportFormat)}
            >
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={onExport}
              disabled={exporting || !exportRangeValid}
              className="h-8 rounded-xl text-sm gap-2"
            >
              <DownloadIcon className="size-3.5" />
              {exporting ? 'Exporting…' : 'Export EODs'}
            </Button>

            <span className="text-xs text-muted-foreground ml-auto">
              {recordCount} records
            </span>
          </div>

          {exportError && (
            <p className="text-xs text-destructive mb-4">{exportError}</p>
          )}
          {!exportRangeValid && dateFrom !== '' && dateTo !== '' && (
            <p className="text-xs text-destructive mb-4">
              From date must be before or equal to To date
            </p>
          )}
    </>
  );
}
