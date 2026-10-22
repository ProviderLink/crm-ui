import { CalendarDays, Clock } from 'lucide-react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { DatePickerField } from '@/components/ui/date-picker-field';
import { TimePickerField } from '@/components/ui/time-picker-field';

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
              error={errors.date?.message}
              hint={
                companyTimezone
                  ? `Your report is filed against the company's business day (${companyTimezone}), which may differ from your local date. Late submissions for an earlier day are still accepted.`
                  : undefined
              }
            >
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    toDate={new Date(`${today}T23:59:59`)}
                  />
                )}
              />
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
