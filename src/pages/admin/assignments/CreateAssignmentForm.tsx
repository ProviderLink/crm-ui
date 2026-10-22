import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Briefcase, CalendarDays, CheckCircle2, StickyNote, Users2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useHiredVasForClientQuery } from '@/hooks/queries';
import { type IAccountManager } from '@/services/account-managers.service';
import { createAssignment } from '@/services/assignments.service';
import { type IAssignment } from '@/types/assignment';
import { Section } from './form-layout';
import { Field } from './form-layout';

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
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: { status: 'active' },
  });

  const selectedClientId = watch('clientId');
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
      const apiMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(
        apiMsg ?? 'Failed to create assignment. Please try again.'
      );
    }
  }

  // No eligible clients: CRM access is determined by crmProfile presence
  if (clients.length === 0) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 py-10 text-center">
          <Users2 size={28} className="text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              No eligible clients
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Only clients who have hired a VA via the ATS appear here.
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
                            <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] rounded px-1.5 py-0.5 bg-white/[0.04] text-[#A0A0A0] ring-1 ring-[rgba(255,255,255,0.08)]">
                              Assigned
                            </span>
                          ) : (
                            <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] rounded px-1.5 py-0.5 bg-white/[0.04] text-[#6E6E6E] ring-1 ring-[rgba(255,255,255,0.08)]">
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
      </Section>

      {/* ── Service ── */}
      <Section icon={<Briefcase size={14} />} title="Service">
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
              maxLength={100}
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
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
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
          disabled={isSubmitting || !isValid}
          className="flex-1 rounded-xl h-10 font-medium gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Create Assignment
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
