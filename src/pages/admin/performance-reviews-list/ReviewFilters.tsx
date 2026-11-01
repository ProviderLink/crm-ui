import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REVIEW_STATUSES } from '@/types/performance-review';

export function ReviewFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  recordCount,
  isAccountManager,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  recordCount: number;
  isAccountManager: boolean;
}) {
  const filtered = search !== '' || statusFilter !== 'all';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search VA or client…"
        label="Search by VA or client"
      />

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger
          className="h-8 w-40 text-sm"
          aria-label="Filter by status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {REVIEW_STATUSES.map(s => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered && (
        <ClearFiltersButton
          onClick={() => {
            onSearchChange('');
            onStatusChange('all');
          }}
        />
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} review{recordCount !== 1 ? 's' : ''}
        {isAccountManager && ' · your assignments'}
      </span>
    </div>
  );
}
