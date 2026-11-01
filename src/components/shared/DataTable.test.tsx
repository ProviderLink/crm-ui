import type { ColumnDef } from '@tanstack/react-table';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from './DataTable';

type Person = { id: number; name: string };

const columns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'id', header: 'Id', enableSorting: false },
];
const people = (n: number): Person[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Person ${String(i + 1).padStart(2, '0')}`,
  }));

const firstCells = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map(r => within(r).getAllByRole('cell')[0]!.textContent);

describe('DataTable', () => {
  it('shows a row per record', () => {
    render(<DataTable columns={columns} data={people(3)} />);
    expect(firstCells()).toEqual(['Person 01', 'Person 02', 'Person 03']);
  });

  it('says so when there is nothing to show', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No records found.')).toBeTruthy();
  });

  it('shows the error message', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        error={new Error('Boom')}
      />
    );
    expect(screen.getByText('Boom')).toBeTruthy();
  });

  it('shows placeholders while loading', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading />
    );
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('sorts when a sortable header is clicked, and says which way', () => {
    render(<DataTable columns={columns} data={people(3).reverse()} />);
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header.getAttribute('aria-sort')).toBeNull();

    fireEvent.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(firstCells()).toEqual(['Person 01', 'Person 02', 'Person 03']);

    fireEvent.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('descending');
    expect(firstCells()).toEqual(['Person 03', 'Person 02', 'Person 01']);
  });

  it('does not offer sorting on a column that opts out', () => {
    render(<DataTable columns={columns} data={people(2)} />);
    const header = screen.getByRole('columnheader', { name: 'Id' });
    expect(within(header).queryByRole('button')).toBeNull();
  });

  it('pages, and marks the current page', () => {
    render(<DataTable columns={columns} data={people(25)} />);
    expect(firstCells()).toHaveLength(10);
    expect(screen.getByText('25 total records')).toBeTruthy();

    const current = () =>
      screen
        .getByRole('navigation', { name: 'Pagination' })
        .querySelector('[aria-current="page"]')?.textContent;
    expect(current()).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(current()).toBe('2');
    expect(firstCells()[0]).toBe('Person 11');

    fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(current()).toBe('3');
    expect(firstCells()).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(firstCells()[0]).toBe('Person 01');
  });

  it('has no pager when everything fits on one page', () => {
    render(<DataTable columns={columns} data={people(5)} />);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
    expect(screen.queryByText(/total records/)).toBeNull();
  });

  it('opens a row on click and on Enter, but only for the row itself', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={people(2)} onRowClick={onRowClick} />
    );
    const row = screen.getAllByRole('row')[1]!;

    fireEvent.click(row);
    expect(onRowClick).toHaveBeenLastCalledWith({ id: 1, name: 'Person 01' });

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(within(row).getAllByRole('cell')[0]!, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
