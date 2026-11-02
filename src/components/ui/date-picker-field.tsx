import * as React from 'react'
import { format, isValid, parse } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string // yyyy-MM-dd
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  toDate?: Date // max selectable date
  /** Accessible name; the button otherwise reads only the chosen date. */
  ariaLabel?: string
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  toDate,
  ariaLabel,
}: DatePickerFieldProps) {
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={ariaLabel}
          data-empty={!validSelected}
          className={cn(
            'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {validSelected ? (
            format(validSelected, 'PPP')
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validSelected}
          onSelect={handleSelect}
          // Moving focus into the calendar when it opens is what a popup should do.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          disabled={toDate ? (d: Date) => d > toDate : undefined}
          style={{ '--cell-size': '2.25rem' } as React.CSSProperties}
        />
      </PopoverContent>
    </Popover>
  )
}
