import { ClockIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TimePickerFieldProps {
  value: string // HH:mm
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function formatDisplay(value: string): string {
  if (!value) return ''
  const [h, m] = value.split(':')
  const hour = parseInt(h ?? '0', 10)
  const min = m ?? '00'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${min} ${ampm}`
}

const QUICK_MINUTES = ['00', '15', '30', '45']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function TimePickerField({
  value,
  onChange,
  placeholder = 'Pick a time',
  className,
}: TimePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [minuteInput, setMinuteInput] = React.useState('')

  const selectedHour = value ? parseInt(value.split(':')[0] ?? '0', 10) : null
  const selectedMinute = value ? (value.split(':')[1] ?? null) : null

  // Sync minute input box when value changes externally
  React.useEffect(() => {
    setMinuteInput(selectedMinute ?? '')
  }, [selectedMinute])

  function applyTime(h: number, m: string) {
    const hh = String(h).padStart(2, '0')
    const mm = String(parseInt(m, 10)).padStart(2, '0')
    onChange(`${hh}:${mm}`)
  }

  function handleHourClick(h: number) {
    applyTime(h, selectedMinute ?? '00')
  }

  function handleQuickMinute(m: string) {
    applyTime(selectedHour ?? 0, m)
    setOpen(false)
  }

  function handleMinuteInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMinuteInput(raw)
    const num = parseInt(raw, 10)
    if (raw.length === 2 && num >= 0 && num <= 59) {
      applyTime(selectedHour ?? 0, raw)
    }
  }

  function handleMinuteBlur() {
    const num = parseInt(minuteInput, 10)
    if (!isNaN(num) && num >= 0 && num <= 59) {
      const mm = String(num).padStart(2, '0')
      applyTime(selectedHour ?? 0, mm)
      setMinuteInput(mm)
      setOpen(false)
    } else {
      setMinuteInput(selectedMinute ?? '')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value}
          className={cn(
            'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground rounded-xl h-10',
            className
          )}
        >
          <ClockIcon className="mr-2 size-4 shrink-0" />
          {value ? formatDisplay(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Select Time
        </div>
        <div className="flex gap-2">
          {/* Hours column */}
          <div className="flex-1 overflow-y-auto max-h-52 space-y-0.5 pr-1">
            {HOURS.map(h => {
              const ampm = h >= 12 ? 'PM' : 'AM'
              const h12 = h % 12 === 0 ? 12 : h % 12
              const isSelected = selectedHour === h
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  className={cn(
                    'w-full text-left text-sm px-2 py-1 rounded-md transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  )}
                >
                  {h12} {ampm}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="w-px bg-border shrink-0" />

          {/* Minutes column */}
          <div className="w-16 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground px-1 mb-0.5">Min</p>
            {/* Free-type input */}
            <Input
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="00"
              value={minuteInput}
              onChange={handleMinuteInput}
              onBlur={handleMinuteBlur}
              className="h-8 text-sm text-center px-1 rounded-lg"
            />
            <div className="w-full h-px bg-border my-0.5" />
            {/* Quick presets */}
            {QUICK_MINUTES.map(m => {
              const isSelected = selectedMinute === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleQuickMinute(m)}
                  className={cn(
                    'w-full text-center text-sm px-2 py-1 rounded-md transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  )}
                >
                  :{m}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
