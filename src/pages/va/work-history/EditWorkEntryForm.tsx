import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateWorkEntry } from '@/services/work-entries.service';
import {
  WORK_ENTRY_CATEGORIES,
  WORK_ENTRY_STATUSES,
  type IWorkEntry,
} from '@/types/work-entry';

const editSchema = z.object({
  entryDate: z.string().min(1, 'Required'),
  entryTime: z.string().min(1, 'Required'),
  taskCategory: z.enum([
    'Administrative',
    'Clinical Coordination',
    'Data Entry',
    'Communication',
    'Research',
    'Scheduling',
    'Other',
  ]),
  taskDescription: z.string().min(1, 'Required'),
  timeSpent: z
    .number()
    .int()
    .min(1, 'At least 1 minute')
    .max(480, 'Maximum is 480 minutes (8 hours) per entry'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

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
}: {
  entry: IWorkEntry;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: toFormValues(entry),
  });

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
      className="mt-6 flex flex-col gap-5 pb-6"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
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
          {errors.entryDate && (
            <p className="text-xs text-destructive">
              {errors.entryDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Time</Label>
          <Input
            type="time"
            {...register('entryTime')}
            className="rounded-md border-input"
          />
          {errors.entryTime && (
            <p className="text-xs text-destructive">
              {errors.entryTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <Controller
          control={control}
          name="taskCategory"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
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
        {errors.taskCategory && (
          <p className="text-xs text-destructive">
            {errors.taskCategory.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Task Description</Label>
        <Textarea
          {...register('taskDescription')}
          rows={3}
          className="rounded-md border-input resize-none"
        />
        {errors.taskDescription && (
          <p className="text-xs text-destructive">
            {errors.taskDescription.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Time Spent (minutes)</Label>
          <Input
            type="number"
            min={1}
            {...register('timeSpent', { valueAsNumber: true })}
            className="rounded-md border-input"
          />
          {errors.timeSpent && (
            <p className="text-xs text-destructive">
              {errors.timeSpent.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-md border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ENTRY_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {s
                        .replace('_', ' ')
                        .replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Notes (optional)</Label>
        <Textarea
          {...register('notes')}
          rows={2}
          className="rounded-md border-input resize-none"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}
