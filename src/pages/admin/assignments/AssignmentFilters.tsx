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
    search !== '' ||
    status !== 'all' ||
    (manager !== null && manager !== 'all');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search VA, client or service…"
        label="Search assignments"
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
        <ClearFiltersButton
          onClick={() => {
            onSearchChange('');
            onStatusChange('all');
            if (manager !== null) onManagerChange('all');
          }}
        />
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {recordCount} assignment{recordCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
