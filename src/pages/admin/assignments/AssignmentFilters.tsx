import { SearchIcon, XIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AssignmentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  manager,
  onManagerChange,
  managers,
  recordCount,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  /** Hidden for account managers, who only ever see their own assignments. */
  manager: string | null;
  onManagerChange: (v: string) => void;
  managers: { id: string; name: string }[];
  recordCount: number;
}) {
  const filtered =
    search !== '' || status !== 'all' || (manager !== null && manager !== 'all');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search VA, client or service…"
          aria-label="Search assignments"
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="on_hold">On hold</SelectItem>
          <SelectItem value="ended">Ended</SelectItem>
        </SelectContent>
      </Select>

      {manager !== null && (
        <Select value={manager} onValueChange={onManagerChange}>
          <SelectTrigger
            className="h-8 w-48 text-sm"
            aria-label="Filter by account manager"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All account managers</SelectItem>
            {managers.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filtered && (
        <button
          type="button"
          onClick={() => {
            onSearchChange('');
            onStatusChange('all');
            if (manager !== null) onManagerChange('all');
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-3.5" />
          Clear
        </button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} assignment{recordCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
