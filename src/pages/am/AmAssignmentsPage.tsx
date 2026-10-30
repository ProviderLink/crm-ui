import { SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AmAssignmentDrawer } from './assignments/AmAssignmentDrawer';
import { buildAmAssignmentColumns } from './assignments/columns';
import { useAmAssignments } from './assignments/use-am-assignments';

type StatusFilter = 'open' | 'active' | 'on_hold' | 'ended' | 'all';

export default function AmAssignmentsPage() {
  const { rows, today, isLoading } = useAmAssignments();
  const [search, setSearch] = useState('');
  // Finished assignments stay out of the way until asked for.
  const [status, setStatus] = useState<StatusFilter>('open');
  const [openId, setOpenId] = useState<string | null>(null);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      rows.filter(r => {
        const s = r.assignment.status;
        if (status === 'open' ? s === 'ended' : status !== 'all' && s !== status)
          return false;
        if (!query) return true;
        return `${r.vaName} ${r.clientName} ${r.service}`
          .toLowerCase()
          .includes(query);
      }),
    [rows, status, query]
  );

  const columns = useMemo(() => buildAmAssignmentColumns(), []);
  const filtered = search !== '' || status !== 'open';

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Assignments
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The VA–client assignments you manage
            </p>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search VA, client or service…"
                aria-label="Search assignments"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select
              value={status}
              onValueChange={v => setStatus(v as StatusFilter)}
            >
              <SelectTrigger
                className="h-8 w-44 text-sm"
                aria-label="Filter by status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Active and on hold</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatus('open');
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {visible.length} assignment{visible.length !== 1 ? 's' : ''}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={visible}
            isLoading={isLoading}
            onRowClick={r => setOpenId(r.assignment._id)}
          />
        </div>
      </div>

      <AmAssignmentDrawer
        assignmentId={openId}
        today={today}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
