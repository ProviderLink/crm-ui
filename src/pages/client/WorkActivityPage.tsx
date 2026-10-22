import { DataTable } from '@/components/shared/DataTable';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useWorkActivity } from './work-activity/use-work-activity';

export default function WorkActivityPage() {
  const w = useWorkActivity();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Work Activity
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your VA's work entries and end-of-day reports
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {w.multipleAssignments && (
              <Select
                value={w.assignmentFilter}
                onValueChange={w.setAssignmentFilter}
              >
                <SelectTrigger className="rounded-xl border-input h-8 text-sm w-52">
                  <SelectValue placeholder="All w.assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All w.assignments</SelectItem>
                  {w.assignments.map(a => (
                    <SelectItem key={a._id} value={a._id}>
                      {w.assignmentLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <DatePickerField
                value={w.dateFrom}
                onChange={v => w.setDateFrom(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={w.dateTo} onChange={v => w.setDateTo(v)} />
            </div>
            {w.hasActiveFilters && (
              <button
                onClick={w.clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="work">
            <TabsList className="mb-4">
              <TabsTrigger value="work">
                Work Entries
                {!w.isLoading && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({w.filteredEntries.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="eod">
                EOD Reports
                {!w.isLoading && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({w.filteredEods.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="work">
              <DataTable
                columns={w.workColumns}
                data={w.filteredEntries}
                isLoading={w.isLoading}
              />
            </TabsContent>

            <TabsContent value="eod">
              <DataTable
                columns={w.eodColumns}
                data={w.filteredEods}
                isLoading={w.isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
