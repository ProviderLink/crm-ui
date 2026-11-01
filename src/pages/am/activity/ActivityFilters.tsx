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
import type { IAssignment } from '@/types/assignment';
import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry';

import { statusLabel } from '@/features/work-entries/format';

export type ActivityTab = 'work' | 'reports';

type Props = {
  tab: ActivityTab;
  search: string;
  onSearch: (v: string) => void;
  assignments: IAssignment[];
  assignmentId: string;
  onAssignment: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  blockersOnly: boolean;
  onBlockersOnly: (v: boolean) => void;
  dateFrom: string;
  onDateFrom: (v: string) => void;
  dateTo: string;
  onDateTo: (v: string) => void;
  hasFilter: boolean;
  onClear: () => void;
  countLabel: string;
  exportFormat: ExportFormat;
  onExportFormat: (v: ExportFormat) => void;
  onExport: () => void;
  exporting: boolean;
  exportRangeValid: boolean;
};

export function ActivityFilters(p: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        value={p.search}
        onChange={p.onSearch}
        placeholder="Search VA, client or task…"
        label="Search activity"
        className="sm:w-64"
      />

      <Select value={p.assignmentId} onValueChange={p.onAssignment}>
        <SelectTrigger className="h-8 w-56 text-sm" aria-label="Filter by VA">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All my VAs</SelectItem>
          {p.assignments.map(a => (
            <SelectItem key={a._id} value={a._id}>
              {[a.candidateName || 'VA', a.companyName]
                .filter(Boolean)
                .join(' — ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {p.tab === 'work' ? (
        <>
          <Select value={p.status} onValueChange={p.onStatus}>
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
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={p.category} onValueChange={p.onCategory}>
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
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={p.blockersOnly}
          onClick={() => p.onBlockersOnly(!p.blockersOnly)}
          className={`h-8 text-sm ${p.blockersOnly ? 'border-status-warning/40 text-status-warning' : ''}`}
        >
          Blockers only
        </Button>
      )}

      <DateRangeFilter
        from={p.dateFrom}
        to={p.dateTo}
        onFromChange={p.onDateFrom}
        onToChange={p.onDateTo}
      />

      {p.hasFilter && <ClearFiltersButton onClick={p.onClear} />}

      <div className="ml-auto flex items-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">
          {p.countLabel}
        </span>
        <Select
          value={p.exportFormat}
          onValueChange={v => p.onExportFormat(v as ExportFormat)}
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
          onClick={p.onExport}
          disabled={p.exporting || !p.exportRangeValid}
          className="h-8 gap-1.5"
        >
          <DownloadIcon className="size-3.5" />
          {p.exporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>
    </div>
  );
}
