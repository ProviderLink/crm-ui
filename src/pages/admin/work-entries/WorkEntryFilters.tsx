import {
  ClearFiltersButton,
  DateRangeFilter,
  SearchInput,
} from '@/components/shared/FilterControls';
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
  searchPlaceholder = 'Search VA, client or task…',
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
  searchPlaceholder?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        label="Search work entries"
        className="sm:w-64"
      />

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger
          className="h-8 w-36 text-sm"
          aria-label="Filter by status"
        >
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

      <DateRangeFilter
        from={dateFrom}
        to={dateTo}
        onFromChange={onDateFromChange}
        onToChange={onDateToChange}
      />

      {hasFilter && <ClearFiltersButton onClick={onClear} />}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} entr{recordCount === 1 ? 'y' : 'ies'}
      </span>
    </div>
  );
}
