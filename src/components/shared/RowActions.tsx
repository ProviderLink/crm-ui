import type { ReactNode } from 'react';

/**
 * The actions cell of a clickable table row. A click inside it must not also
 * open the row, so it is stopped here, once.
 */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex justify-end"
      role="presentation"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
