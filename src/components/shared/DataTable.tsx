import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { ErrorNotice } from './ErrorNotice';
import { columnWidthStyle } from './data-table/column-style';
import { DataTablePagination } from './data-table/DataTablePagination';
import { PAGE_SIZE_OPTIONS } from './data-table/page-sizes';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  pageSize?: number;
  /** Makes each row clickable (and keyboard-activatable). */
  onRowClick?: (row: T) => void;
}

const SORT_ARIA = { asc: 'ascending', desc: 'descending' } as const;

/**
 * A sortable, paged table. Columns say how wide they are through `size` and
 * `meta` (`fill`, `shrink`, `thClassName`, `cellClassName`).
 */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  error = null,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorNotice error={error} />;

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted/50"
              >
                {headerGroup.headers.map(header => {
                  const def = header.column.columnDef;
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted ? SORT_ARIA[sorted] : undefined}
                      className={`px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide text-left ${def.meta?.thClassName ?? ''}`}
                      style={columnWidthStyle(def)}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={e =>
                            header.column.getToggleSortingHandler()?.(e)
                          }
                        >
                          {flexRender(def.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : sorted === 'desc' ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronsUpDown size={12} className="opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(def.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none' : ''}`}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? e => {
                          if (
                            e.target === e.currentTarget &&
                            (e.key === 'Enter' || e.key === ' ')
                          ) {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map(cell => {
                    const def = cell.column.columnDef;
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-foreground ${def.meta?.cellClassName ?? ''}`}
                        style={columnWidthStyle(def)}
                      >
                        {flexRender(def.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Keep the footer while there are more rows than the smallest page
          size, so "Rows per page" can still be changed back after everything
          fits on one page. */}
      {data.length > PAGE_SIZE_OPTIONS[0]! && (
        <DataTablePagination table={table} totalRecords={data.length} />
      )}
    </div>
  );
}
