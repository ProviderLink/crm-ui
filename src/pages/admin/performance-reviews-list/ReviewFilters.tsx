import { SearchIcon, XIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
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
      <div className="relative w-full sm:w-72">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search VA or client…"
          aria-label="Search by VA or client"
          className="h-8 pl-8 text-sm"
        />
      </div>

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
        <button
          type="button"
          onClick={() => {
            onSearchChange('');
            onStatusChange('all');
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-3.5" />
          Clear
        </button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} review{recordCount !== 1 ? 's' : ''}
        {isAccountManager && ' · your assignments'}
      </span>
    </div>
  );
}
