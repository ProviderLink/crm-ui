import { SearchIcon, XIcon } from 'lucide-react';

import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';

export function EodHistoryFilters({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasFilter,
  onClear,
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
  recordCount: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search client or task…"
          aria-label="Search EOD reports"
          className="h-8 pl-8 text-sm"
        />
      </div>

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

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} report{recordCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
