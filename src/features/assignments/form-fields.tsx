import { AlertCircle, CheckCircle2, StickyNote } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';

import { Field, Section } from '@/components/shared/form-layout';
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
import type { IAssignment } from '@/types/assignment';
import type { IAccountManager } from '@/types/user';

// Fields the create and edit assignment forms have in common. The forms own
// their schemas; these take the form's `control` and `register`.

type Status = IAssignment['status'];

/** The error returned by the server, above the form. */
export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      {message}
    </div>
  );
}

export function AccountManagerField<
  T extends FieldValues & { accountManagerId: string },
>({
  control,
  team,
  error,
}: {
  control: Control<T>;
  team: IAccountManager[];
  error?: string;
}) {
  return (
    <Field label="Account Manager" error={error}>
      <Controller
        control={control}
        name={'accountManagerId' as Path<T>}
        render={({ field }) => (
          <Select
            value={field.value || undefined}
            onValueChange={field.onChange}
          >
            <SelectTrigger className="h-10 rounded-xl border-input">
              <SelectValue placeholder="Select account manager" />
            </SelectTrigger>
            <SelectContent>
              {team.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

/** What the VA does for the client, and the status of the assignment. */
export function ServiceFields<
  T extends FieldValues & { serviceType: string; status: Status },
>({
  control,
  register,
  serviceTypeError,
  statusError,
  statuses,
  maxLength,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  serviceTypeError?: string;
  statusError?: string;
  statuses: { value: Status; label: string }[];
  maxLength?: number;
}) {
  return (
    <div className="grid grid-cols-[3fr_2fr] items-end gap-4">
      <Field
        label="Service Type"
        error={serviceTypeError}
        hint="e.g. Medical VA, Admin Support"
      >
        <Input
          {...register('serviceType' as Path<T>)}
          placeholder="Service type"
          className="h-10 rounded-xl border-input"
          maxLength={maxLength}
        />
      </Field>

      <Field label="Status" error={statusError}>
        <Controller
          control={control}
          name={'status' as Path<T>}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10 rounded-xl border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
    </div>
  );
}

/** Contracted hours; scorecards measure the VA's hours against this. */
export function WeeklyHoursField<
  T extends FieldValues & { weeklyHours: number },
>({ register, error }: { register: UseFormRegister<T>; error?: string }) {
  return (
    <Field
      label="Hours per week"
      error={error}
      hint="Contracted hours. Scorecards measure hours against this."
    >
      <Input
        {...register('weeklyHours' as Path<T>, { valueAsNumber: true })}
        type="number"
        min={1}
        max={60}
        className="h-10 rounded-xl border-input"
      />
    </Field>
  );
}

export function NotesSection<T extends FieldValues & { notes?: string }>({
  register,
  error,
}: {
  register: UseFormRegister<T>;
  error?: string;
}) {
  return (
    <Section icon={<StickyNote size={14} />} title="Notes" optional>
      <Field label="" error={error}>
        <Textarea
          {...register('notes' as Path<T>)}
          placeholder="Any additional notes…"
          className="resize-none rounded-xl border-input"
          rows={3}
        />
      </Field>
    </Section>
  );
}

export function FormFooter({
  submitting,
  disabled = false,
  submitLabel,
  submittingLabel,
  onCancel,
}: {
  submitting: boolean;
  disabled?: boolean;
  submitLabel: string;
  submittingLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <Button
        type="submit"
        disabled={submitting || disabled}
        className="h-10 flex-1 gap-2 rounded-xl font-medium"
      >
        {submitting ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {submittingLabel}
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            {submitLabel}
          </>
        )}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
