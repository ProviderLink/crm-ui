import { Trash2Icon } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
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

import { Field } from './layout';
import { STATUS_LABELS, type FormData } from './schema';

export function WorkEntryCard({
  idx,
  canRemove,
  onRemove,
  control,
  register,
  errors,
}: {
  idx: number;
  canRemove: boolean;
  onRemove: () => void;
  control: Control<FormData>;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) {
  return (
              <div
                className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Work {idx + 1}
                  </span>
                  {canRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
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
                    className="rounded-xl border-input h-10"
                    {...register(`workEntries.${idx}.task`)}
                  />
                </Field>

                <Field
                  label="Description"
                  error={errors.workEntries?.[idx]?.description?.message}
                >
                  <Textarea
                    placeholder="Brief description of what was done"
                    className="rounded-xl border-input resize-none"
                    rows={2}
                    {...register(`workEntries.${idx}.description`)}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="Quantity"
                    error={errors.workEntries?.[idx]?.quantity?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="rounded-xl border-input h-10"
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
                          <SelectTrigger className="rounded-xl border-input h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EOD_WORK_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Time Spent (min)"
                    error={errors.workEntries?.[idx]?.timeSpent?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="rounded-xl border-input h-10"
                      {...register(`workEntries.${idx}.timeSpent`, {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                </div>
              </div>
  );
}
