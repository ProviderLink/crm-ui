import { CalendarDays } from 'lucide-react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { TimePickerField } from '@/components/ui/time-picker-field';
import { formatDateKeyLong } from '@/lib/time';

import { Field, Section } from './layout';
import type { FormData } from './schema';

export function ShiftSection({
  control,
  errors,
  today,
  companyTimezone,
  hoursWorked,
}: {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  today: string;
  companyTimezone: string | null;
  hoursWorked: number;
}) {
  return (
    <Section icon={<CalendarDays size={14} />} title="Shift">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date">
          <div className="flex h-10 items-center rounded-md border border-border bg-white/[0.03] px-3 text-sm">
            {formatDateKeyLong(today)}
          </div>
        </Field>
        <Field label="Shift start" error={errors.shiftStart?.message}>
          <Controller
            name="shiftStart"
            control={control}
            render={({ field }) => (
              <TimePickerField value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field label="Shift end" error={errors.shiftEnd?.message}>
          <Controller
            name="shiftEnd"
            control={control}
            render={({ field }) => (
              <TimePickerField value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
      </div>

      {(companyTimezone || hoursWorked > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {companyTimezone ? (
            <p className="text-xs text-muted-foreground">
              Filed against the company’s business day ({companyTimezone}),
              which may differ from your local date.
            </p>
          ) : (
            <span />
          )}
          {hoursWorked > 0 && (
            <p className="text-xs text-muted-foreground">
              Total{' '}
              <span className="text-sm font-medium tabular-nums text-foreground">
                {hoursWorked}h
              </span>
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
