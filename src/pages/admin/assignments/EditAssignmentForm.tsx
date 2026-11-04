import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, CalendarDays, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  AccountManagerField,
  FormErrorBanner,
  FormFooter,
  NotesSection,
  ServiceFields,
  WeeklyHoursField,
} from '@/features/assignments/form-fields';
import { getApiError } from '@/lib/api-error';
import { type IAccountManager } from '@/types/user';
import { updateAssignment } from '@/services/assignments.service';
import { type IAssignment } from '@/types/assignment';
import { Section } from '@/components/shared/form-layout';
import { Field } from '@/components/shared/form-layout';

/** `startDate` is the assignment's own, so the end cannot come before it. */
const makeEditSchema = (startDate: string) =>
  z
    .object({
      accountManagerId: z.string().min(1, 'Required'),
      status: z.enum(['active', 'on_hold', 'ended']),
      weeklyHours: z
        .number({ message: 'Enter the hours per week' })
        .min(1, 'At least 1 hour')
        .max(60, 'At most 60 hours'),
      serviceType: z
        .string()
        .min(1, 'Required')
        .max(SERVICE_TYPE_MAX, `Max ${SERVICE_TYPE_MAX} characters`),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine(d => !d.endDate || d.endDate >= startDate.slice(0, 10), {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    });
type EditFormData = z.infer<ReturnType<typeof makeEditSchema>>;

const SERVICE_TYPE_MAX = 100;

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
    resolver: zodResolver(makeEditSchema(assignment.startDate)),
    defaultValues: {
      accountManagerId: assignment.accountManagerId ?? '',
      status: assignment.status,
      serviceType: assignment.serviceType ?? '',
      weeklyHours: assignment.weeklyHours ?? 40,
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
        // Empty string = user cleared the field → send null so the backend clears it
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormErrorBanner message={serverError} />}

      {/* ── Assignment Details ── */}
      <Section icon={<Briefcase size={14} />} title="Assignment Details">
        <AccountManagerField
          control={control}
          team={team}
          error={errors.accountManagerId?.message}
        />

        <ServiceFields
          control={control}
          register={register}
          serviceTypeError={errors.serviceType?.message}
          statusError={errors.status?.message}
          statuses={[
            { value: 'active', label: 'Active' },
            { value: 'on_hold', label: 'On Hold' },
            { value: 'ended', label: 'Ended' },
          ]}
          maxLength={SERVICE_TYPE_MAX}
        />

        <WeeklyHoursField
          register={register}
          error={errors.weeklyHours?.message}
        />
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
      <NotesSection register={register} error={errors.notes?.message} />

      <FormFooter
        submitting={isSubmitting}
        submitLabel="Save Changes"
        submittingLabel="Saving…"
        onCancel={onClose}
      />
    </form>
  );
}
