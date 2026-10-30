import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, FileText, StickyNote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerField } from '@/components/ui/time-picker-field';
import { updateWorkEntry } from '@/services/work-entries.service';
import {
  WORK_ENTRY_CATEGORIES,
  WORK_ENTRY_STATUSES,
  type IWorkEntry,
} from '@/types/work-entry';

import { Field, Section } from '../../admin/assignments/form-layout';
import { DurationPresets } from '../duration-presets';

const editSchema = z.object({
  entryDate: z.string().min(1, 'Date is required'),
  entryTime: z.string().min(1, 'Time is required'),
  taskCategory: z.enum(
    [
      'Administrative',
      'Clinical Coordination',
      'Data Entry',
      'Communication',
      'Research',
      'Scheduling',
      'Other',
    ],
    { error: 'Category is required' }
  ),
  taskDescription: z.string().min(1, 'Description is required'),
  timeSpent: z
    .number({ error: 'Duration is required' })
    .int('Enter whole minutes')
    .min(1, 'At least 1 minute')
    .max(480, 'Maximum is 480 minutes (8 hours) per entry'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  completed: { label: 'Completed', dot: 'bg-status-success' },
  in_progress: { label: 'In Progress', dot: 'bg-status-info' },
  pending: { label: 'Pending', dot: 'bg-status-warning' },
};

function toFormValues(entry: IWorkEntry): EditFormData {
  return {
    entryDate: entry.entryDate?.slice(0, 10) ?? '',
    entryTime: entry.entryTime ?? '',
    taskCategory: entry.taskCategory,
    taskDescription: entry.taskDescription,
    timeSpent: entry.timeSpent,
    status: entry.status,
    notes: entry.notes ?? '',
  };
}

export function EditWorkEntryForm({
  entry,
  onSuccess,
  onCancel,
}: {
  entry: IWorkEntry;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: toFormValues(entry),
  });

  const timeSpent = useWatch({ control, name: 'timeSpent' });
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    reset(toFormValues(entry));
  }, [entry, reset]);

  async function onSubmit(data: EditFormData) {
    setServerError('');
    try {
      await updateWorkEntry(entry._id, data);
      onSuccess();
    } catch {
      setServerError('Failed to save. Please try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {serverError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Section icon={<CalendarDays size={14} />} title="When and how long">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" error={errors.entryDate?.message}>
              <Controller
                name="entryDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    toDate={new Date()}
                  />
                )}
              />
            </Field>
            <Field label="Start time" error={errors.entryTime?.message}>
              <Controller
                name="entryTime"
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

          <Field label="Duration" error={errors.timeSpent?.message}>
            <div className="relative sm:max-w-[calc(50%-0.5rem)]">
              <Input
                type="number"
                min={1}
                className="pr-12"
                {...register('timeSpent', { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                min
              </span>
            </div>
          </Field>
          <DurationPresets
            value={timeSpent}
            onPick={m =>
              setValue('timeSpent', m, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Section>

        <Section icon={<FileText size={14} />} title="Task">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.taskCategory?.message}>
              <Controller
                control={control}
                name="taskCategory"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ENTRY_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ENTRY_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`size-1.5 rounded-full ${STATUS_CONFIG[s]?.dot ?? 'bg-text-tertiary'}`}
                            />
                            {STATUS_CONFIG[s]?.label ?? s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="Description" error={errors.taskDescription?.message}>
            <Textarea
              {...register('taskDescription')}
              rows={3}
              className="resize-none"
            />
          </Field>
        </Section>

        <Section icon={<StickyNote size={14} />} title="Notes" optional>
          <Field label="" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              rows={2}
              className="resize-none"
            />
          </Field>
        </Section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
