import { CalendarDays, Clock } from 'lucide-react';
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
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Date"
              hint={
                companyTimezone
                  ? `Filed against the company's business day (${companyTimezone}), which may differ from your local date.`
                  : undefined
              }
            >
              <p className="flex h-9 items-center text-sm text-foreground">
                {formatDateKeyLong(today)}
              </p>
            </Field>
            <Field label="Shift Start" error={errors.shiftStart?.message}>
              <Controller
                name="shiftStart"
                control={control}
                render={({ field }) => (
                  <TimePickerField
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Shift End" error={errors.shiftEnd?.message}>
              <Controller
                name="shiftEnd"
                control={control}
                render={({ field }) => (
                  <TimePickerField
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>

          {/* Hours worked pill */}
          {hoursWorked > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 border border-border/50 w-fit">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {hoursWorked}h
              </span>
              <span className="text-xs text-muted-foreground">total hours</span>
            </div>
          )}
        </Section>
  );
}
