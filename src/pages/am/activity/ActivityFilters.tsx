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
import type { IAssignment } from '@/types/assignment';
import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry';

import { statusLabel } from '../../admin/work-entries/format';

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
      <div className="relative w-full sm:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={p.search}
          onChange={e => p.onSearch(e.target.value)}
          placeholder="Search VA, client or task…"
          aria-label="Search activity"
          className="h-8 pl-8 text-sm"
        />
      </div>

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

      <div className="flex items-center gap-1.5">
        <DatePickerField value={p.dateFrom} onChange={p.onDateFrom} />
        <span className="text-xs text-muted-foreground">to</span>
        <DatePickerField value={p.dateTo} onChange={p.onDateTo} />
      </div>

      {p.hasFilter && (
        <button
          type="button"
          onClick={p.onClear}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-3.5" />
          Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">
          {p.countLabel}
        </span>
        <Select
          value={p.exportFormat}
          onValueChange={v => p.onExportFormat(v as ExportFormat)}
        >
          <SelectTrigger className="h-8 w-24 text-sm" aria-label="Export format">
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
