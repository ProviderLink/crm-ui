import type { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PAGE_SIZE_OPTIONS } from './page-sizes';

/** Page numbers to show: the first, the last and two either side of the current. */
function pageWindow(currentPage: number, totalPages: number) {
  const delta = 2;
  const pages: (number | '...')[] = [];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

const NAV_BUTTON = 'h-7 w-7 p-0';

/** Total, rows per page, and page buttons under a table. */
export function DataTablePagination<T>({
  table,
  totalRecords,
}: {
  table: Table<T>;
  totalRecords: number;
}) {
  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className="flex items-center justify-between px-1 flex-wrap gap-2">
      {/* Left: total info + rows per page */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalRecords} total records
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={val => {
              table.setPageSize(Number(val));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs rounded-lg border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: page navigation */}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            className={NAV_BUTTON}
            aria-label="First page"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={NAV_BUTTON}
            aria-label="Previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={14} />
          </Button>

          {pageWindow(currentPage, totalPages).map((page, i) =>
            page === '...' ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                className={`${NAV_BUTTON} text-xs`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                onClick={() => table.setPageIndex(page - 1)}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            className={NAV_BUTTON}
            aria-label="Next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={NAV_BUTTON}
            aria-label="Last page"
            onClick={() => table.setPageIndex(totalPages - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={14} />
          </Button>
        </nav>
      )}
    </div>
  );
}
