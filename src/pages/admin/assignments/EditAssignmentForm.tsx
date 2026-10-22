import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Briefcase, CalendarDays, CheckCircle2, StickyNote, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api-error';
import { type IAccountManager } from '@/services/account-managers.service';
import { updateAssignment } from '@/services/assignments.service';
import { type IAssignment } from '@/types/assignment';
import { Section } from './form-layout';
import { Field } from './form-layout';

const editSchema = z.object({
  accountManagerId: z.string().min(1, 'Required'),
  status: z.enum(['active', 'on_hold', 'ended']),
  serviceType: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

function sanitizeDate(value: string | undefined | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '';
  return value.slice(0, 10);
}

export function EditAssignmentForm({
  assignment,
  team,
  onSuccess,
  onClose,
}: {
  assignment: IAssignment;
  team: IAccountManager[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      accountManagerId: assignment.accountManagerId ?? '',
      status: assignment.status,
      serviceType: assignment.serviceType ?? '',
      endDate: sanitizeDate(assignment.endDate),
      notes: assignment.notes ?? '',
    },
  });

  const [serverError, setServerError] = useState('');

  async function onSubmit(data: EditFormData) {
    setServerError('');
    try {
      const { endDate, ...rest } = data;
      await updateAssignment(assignment._id, {
        ...rest,
        // Convert date to ISO for backend validation
        // Empty string = user cleared the field → send null so backend deletes it from Firestore
        // Value present → convert to ISO
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });
      onSuccess();
    } catch (err: unknown) {
      setServerError(
        getApiError(err, 'Failed to save changes. Please try again.')
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 space-y-4"
    >
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Assignment Details ── */}
      <Section icon={<Briefcase size={14} />} title="Assignment Details">
        <Field label="Account Manager" error={errors.accountManagerId?.message}>
          <Controller
            control={control}
            name="accountManagerId"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="rounded-xl border-input h-10">
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

        <div className="grid grid-cols-[3fr_2fr] gap-4 items-end">
          <Field
            label="Service Type"
            error={errors.serviceType?.message}
            hint="e.g. Medical VA, Admin Support"
          >
            <Input
              {...register('serviceType')}
              placeholder="Service type"
              className="rounded-xl border-input h-10"
            />
          </Field>

          <Field label="Status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-input h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </Section>

      {/* ── Timeline ── */}
      <Section icon={<CalendarDays size={14} />} title="Timeline">
        <Field
          label="End Date"
          error={errors.endDate?.message}
          hint="Leave blank if still ongoing"
        >
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  className="flex-1"
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => field.onChange('')}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Clear date"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            )}
          />
        </Field>
      </Section>

      {/* ── Notes ── */}
      <Section icon={<StickyNote size={14} />} title="Notes" optional>
        <Field label="" error={errors.notes?.message}>
          <Textarea
            {...register('notes')}
            placeholder="Any additional notes…"
            className="rounded-xl border-input resize-none"
            rows={3}
          />
        </Field>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl h-10 font-medium gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Save Changes
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
