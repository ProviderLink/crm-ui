import { useMemo, useState } from 'react';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { DataTable } from '@/components/shared/DataTable';
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
        if (
          status === 'open' ? s === 'ended' : status !== 'all' && s !== status
        )
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
    <Page
      overlays={
        <>
          <AmAssignmentDrawer
            assignmentId={openId}
            today={today}
            onClose={() => setOpenId(null)}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Assignments"
          description="The VA–client assignments you manage"
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search VA, client or service…"
            label="Search assignments"
          />
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
            <ClearFiltersButton
              onClick={() => {
                setSearch('');
                setStatus('open');
              }}
            />
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
      </PageSection>
    </Page>
  );
}
