import type { RowData } from '@tanstack/react-table';

// What a column can say about its layout, read by components/shared/DataTable.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** The column takes all the spare width. */
    fill?: boolean;
    /** The column is as narrow as its content. */
    shrink?: boolean;
    /** Extra classes for the header cell. */
    thClassName?: string;
    /** Extra classes for the body cells. */
    cellClassName?: string;
  }
}
