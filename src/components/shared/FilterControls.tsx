import { SearchIcon, XIcon } from 'lucide-react';

import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** The search box of a list's filter bar. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  className = 'sm:w-72',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name; defaults to the placeholder. */
  label?: string;
  /** Width on wider screens. */
  className?: string;
}) {
  return (
    <div className={cn('relative w-full', className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}

/** "Clear" link shown when a filter bar has been changed. */
export function ClearFiltersButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <XIcon className="size-3.5" />
      Clear
    </button>
  );
}

/** From and to date pickers, side by side. */
export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <DatePickerField
        value={from}
        onChange={onFromChange}
        ariaLabel="From date"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <DatePickerField value={to} onChange={onToChange} ariaLabel="To date" />
    </div>
  );
}
