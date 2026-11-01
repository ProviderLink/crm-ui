import type { ReactNode } from 'react';

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
import { formatDateKeyShort } from '@/lib/time';
import type { IScorecard } from '@/types/scorecard';

/** Search, week picker and count above the scorecard table. */
export function ScorecardFilters({
  search,
  onSearchChange,
  week,
  weeks,
  onWeekChange,
  count,
  error,
  trailing,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  week: string;
  weeks: [string, IScorecard][];
  onWeekChange: (value: string) => void;
  count: number;
  error?: string | null;
  /** Buttons after the count. */
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search VA or company…"
        label="Search by VA or company"
      />
      <Select value={week} onValueChange={onWeekChange}>
        <SelectTrigger className="h-8 w-48 text-sm" aria-label="Filter by week">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All weeks</SelectItem>
          {weeks.map(([key, sc], i) => (
            <SelectItem key={key} value={key}>
              {formatDateKeyShort(sc.weekStart)} –{' '}
              {formatDateKeyShort(sc.weekEnd)}
              {i === 0 && ' (latest)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {search && <ClearFiltersButton onClick={() => onSearchChange('')} />}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <span className="ml-auto text-xs text-muted-foreground">
        {count} scorecard{count !== 1 ? 's' : ''}
      </span>
      {trailing}
    </div>
  );
}
