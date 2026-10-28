import { SearchIcon, XIcon } from 'lucide-react';

import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  WORK_ENTRY_CATEGORIES,
  WORK_ENTRY_STATUSES,
  type WorkEntryStatus,
} from '@/types/work-entry';

import { statusLabel } from './format';

export function WorkEntryFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
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
  status: string;
  onStatusChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
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
          placeholder="Search VA, client or task…"
          aria-label="Search work entries"
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {WORK_ENTRY_STATUSES.map(s => (
            <SelectItem key={s} value={s}>
              {statusLabel(s as WorkEntryStatus)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger
          className="h-8 w-44 text-sm"
          aria-label="Filter by category"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {WORK_ENTRY_CATEGORIES.map(c => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
        {recordCount} entr{recordCount === 1 ? 'y' : 'ies'}
      </span>
    </div>
  );
}
