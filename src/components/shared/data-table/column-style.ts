import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

/** TanStack's default column size, which means "no width was set". */
const DEFAULT_COLUMN_SIZE = 150;

/** Width of a column's header and body cells, from its `meta` and `size`. */
export function columnWidthStyle<T extends RowData>(
  column: ColumnDef<T>
): CSSProperties | undefined {
  if (column.meta?.shrink) return { width: '1px' };
  if (column.meta?.fill) return { width: '100%' };
  const size = column.size;
  if (size && size !== DEFAULT_COLUMN_SIZE)
    return { width: size, minWidth: size };
  return undefined;
}
