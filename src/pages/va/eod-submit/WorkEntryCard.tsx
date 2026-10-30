import { Trash2Icon } from 'lucide-react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EOD_WORK_STATUSES } from '@/types/eod-submission';

import { DurationPresets } from '../duration-presets';
import { Field } from './layout';
import { STATUS_LABELS, type FormData } from './schema';

// Status colour is a small dot only, like the pills elsewhere in the CRM.
const STATUS_DOT: Record<string, string> = {
  completed: 'bg-status-success',
  in_progress: 'bg-status-info',
  pending: 'bg-status-warning',
};

/** One work item of the report: a flat group inside the shared list. */
export function WorkEntryCard({
  idx,
  canRemove,
  onRemove,
  control,
  register,
  setValue,
  errors,
}: {
  idx: number;
  canRemove: boolean;
  onRemove: () => void;
  control: Control<FormData>;
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  errors: FieldErrors<FormData>;
}) {
  const timeSpent = useWatch({
    control,
    name: `workEntries.${idx}.timeSpent`,
  });

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Work {idx + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove this work entry"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove this work entry"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        )}
      </div>

      <Field
        label="Task / Work"
        error={errors.workEntries?.[idx]?.task?.message}
      >
        <Input
          placeholder="e.g. Patient calls"
          {...register(`workEntries.${idx}.task`)}
        />
      </Field>

      <Field
        label="Description"
        error={errors.workEntries?.[idx]?.description?.message}
      >
        <Textarea
          placeholder="Brief description of what was done"
          className="resize-none"
          rows={2}
          {...register(`workEntries.${idx}.description`)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Quantity"
          error={errors.workEntries?.[idx]?.quantity?.message}
        >
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            {...register(`workEntries.${idx}.quantity`, {
              valueAsNumber: true,
            })}
          />
        </Field>

        <Field
          label="Status"
          error={errors.workEntries?.[idx]?.status?.message}
        >
          <Controller
            control={control}
            name={`workEntries.${idx}.status`}
            render={({ field: statusField }) => (
              <Select
                value={statusField.value}
                onValueChange={statusField.onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EOD_WORK_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-1.5 rounded-full ${STATUS_DOT[s] ?? 'bg-text-tertiary'}`}
                        />
                        {STATUS_LABELS[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Time spent"
          error={errors.workEntries?.[idx]?.timeSpent?.message}
        >
          <div className="relative">
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              className="pr-12"
              {...register(`workEntries.${idx}.timeSpent`, {
                valueAsNumber: true,
              })}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
              min
            </span>
          </div>
        </Field>
      </div>

      <DurationPresets
        value={timeSpent}
        onPick={m =>
          setValue(`workEntries.${idx}.timeSpent`, m, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    </div>
  );
}
