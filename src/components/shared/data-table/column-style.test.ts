import type { ColumnDef } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { columnWidthStyle } from './column-style';

type Row = { id: string };
const col = (def: Partial<ColumnDef<Row>>): ColumnDef<Row> =>
  def as ColumnDef<Row>;

describe('columnWidthStyle', () => {
  it('is as narrow as the content for a shrink column', () => {
    expect(columnWidthStyle(col({ meta: { shrink: true } }))).toEqual({
      width: '1px',
    });
  });

  it('takes the spare width for a fill column', () => {
    expect(columnWidthStyle(col({ meta: { fill: true } }))).toEqual({
      width: '100%',
    });
  });

  it('prefers shrink over fill', () => {
    expect(
      columnWidthStyle(col({ meta: { shrink: true, fill: true } }))
    ).toEqual({ width: '1px' });
  });

  it('uses a set size as the width and minimum width', () => {
    expect(columnWidthStyle(col({ size: 220 }))).toEqual({
      width: 220,
      minWidth: 220,
    });
  });

  it('leaves the default size alone', () => {
    expect(columnWidthStyle(col({ size: 150 }))).toBeUndefined();
    expect(columnWidthStyle(col({}))).toBeUndefined();
  });
});
