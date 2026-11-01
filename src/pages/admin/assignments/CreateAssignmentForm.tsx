import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, CalendarDays, Users2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHiredVasForClientQuery } from '@/hooks/queries';
import {
  AccountManagerField,
  FormErrorBanner,
  FormFooter,
  NotesSection,
  ServiceFields,
} from '@/features/assignments/form-fields';
import { getApiError } from '@/lib/api-error';
import { type IAccountManager } from '@/types/user';
import { createAssignment } from '@/services/assignments.service';
import { type IAssignment } from '@/types/assignment';
import { Section } from '@/components/shared/form-layout';
import { Field } from '@/components/shared/form-layout';

const createSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  candidateId: z.string().min(1, 'Virtual assistant is required'),
  accountManagerId: z.string().min(1, 'Account manager is required'),
  serviceType: z
    .string()
    .min(1, 'Service type is required')
    .max(100, 'Max 100 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'ended']),
  notes: z.string().optional(),
});
type CreateFormData = z.infer<typeof createSchema>;

export function CreateAssignmentForm({
  clients,
  assignments,
  team,
  onSuccess,
  onClose,
}: {
  clients: { clientId: string; companyName: string }[];
  assignments: IAssignment[];
  team: IAccountManager[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: { status: 'active' },
  });

  const selectedClientId = useWatch({ control, name: 'clientId' });
  const { data: clientVas = [], isLoading: vasLoading } =
    useHiredVasForClientQuery(selectedClientId || undefined);

  // VAs already on an active/on_hold assignment
  const activeCandidateIds = new Set(
    assignments
      .filter(a => a.status === 'active' || a.status === 'on_hold')
      .map(a => a.candidateId)
  );

  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateFormData) {
    setServerError('');
    try {
      const { startDate, endDate, ...rest } = data;
      await createAssignment({
        ...rest,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setServerError(
        getApiError(err, 'Failed to create assignment. Please try again.')
      );
    }
  }

  // No eligible clients: CRM access is determined by crmProfile presence
  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 py-10 text-center">
          <Users2 size={28} className="text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              No eligible clients
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              A client appears here once an admin has provisioned its CRM access
              in the ATS (Clients → open the client → CRM access). That needs an
              active client with a hired VA.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormErrorBanner message={serverError} />}

      {/* ── People ── */}
      <Section icon={<Users2 size={14} />} title="People">
        <Field label="Client" error={errors.clientId?.message}>
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={v => {
                  field.onChange(v);
                  setValue('candidateId', '', { shouldValidate: false });
                }}
              >
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.clientId} value={c.clientId}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Virtual Assistant"
          error={errors.candidateId?.message}
          hint={
            !selectedClientId
              ? 'Select a client first'
              : vasLoading
                ? 'Loading VAs…'
                : clientVas.length === 0
                  ? 'No hired VAs for this client'
                  : undefined
          }
        >
          <Controller
            control={control}
            name="candidateId"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={
                  !selectedClientId || vasLoading || clientVas.length === 0
                }
              >
                <SelectTrigger className="rounded-xl border-input h-10">
                  <SelectValue
                    placeholder={
                      selectedClientId ? 'Select VA' : 'Select client first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clientVas.map(v => {
                    const hasAssignment = activeCandidateIds.has(v.id);
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex items-center gap-2">
                          {v.firstName} {v.lastName}
                          {hasAssignment ? (
                            <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] rounded px-1.5 py-0.5 bg-white/[0.04] text-text-secondary ring-1 ring-[rgba(255,255,255,0.08)]">
                              Assigned
                            </span>
                          ) : (
                            <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] rounded px-1.5 py-0.5 bg-white/[0.04] text-text-tertiary ring-1 ring-[rgba(255,255,255,0.08)]">
                              Free
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <AccountManagerField
          control={control}
          team={team}
          error={errors.accountManagerId?.message}
        />
      </Section>

      {/* ── Service ── */}
      <Section icon={<Briefcase size={14} />} title="Service">
        <ServiceFields
          control={control}
          register={register}
          serviceTypeError={errors.serviceType?.message}
          statusError={errors.status?.message}
          statuses={[
            { value: 'active', label: 'Active' },
            { value: 'on_hold', label: 'On Hold' },
          ]}
          maxLength={100}
        />
      </Section>

      {/* ── Timeline ── */}
      <Section icon={<CalendarDays size={14} />} title="Timeline">
        <div className="grid grid-cols-2 gap-4 items-end">
          <Field label="Start Date" error={errors.startDate?.message}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <Field
            label="End Date"
            error={errors.endDate?.message}
            hint="Leave blank if ongoing"
          >
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
      </Section>

      {/* ── Notes ── */}
      <NotesSection register={register} error={errors.notes?.message} />

      <FormFooter
        submitting={isSubmitting}
        disabled={!isValid}
        submitLabel="Create Assignment"
        submittingLabel="Creating…"
        onCancel={onClose}
      />
    </form>
  );
}
