import {
  ClearFiltersButton,
  DateRangeFilter,
  SearchInput,
} from '@/components/shared/FilterControls';

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
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search client or task…"
        label="Search EOD reports"
        className="sm:w-64"
      />

      <DateRangeFilter
        from={dateFrom}
        to={dateTo}
        onFromChange={onDateFromChange}
        onToChange={onDateToChange}
      />

      {hasFilter && <ClearFiltersButton onClick={onClear} />}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} report{recordCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
