import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { generateReview } from '@/services/performance-reviews.service';
import {
  REVIEW_TYPES,
  ROLE_TYPES,
  type ReviewType,
  type RoleType,
} from '@/types/performance-review';

const schema = z.object({
  clientId: z.string().min(1, 'Please select a client'),
  vaId: z.string().min(1, 'Please select a VA'),
  reviewType: z.enum(REVIEW_TYPES as [ReviewType, ...ReviewType[]]),
  reviewPeriodStart: z.string().min(1, 'Required'),
  reviewPeriodEnd: z.string().min(1, 'Required'),
  roleType: z.enum(ROLE_TYPES as [RoleType, ...RoleType[]]),
  jobDescription: z.string().min(10, 'Please enter a job description'),
  clientExpectations: z.string().min(1, 'Required'),
  managerNotes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface GenerateReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCandidateName?: string;
  defaultClientName?: string;
  defaultJobTitle?: string;
  defaultJobDescription?: string;
  vaId?: string;
  clientId?: string;
  jobId?: string;
}

export function GenerateReviewModal({
  open,
  onOpenChange,
  defaultCandidateName = '',
  defaultClientName = '',
  defaultJobTitle = '',
  defaultJobDescription = '',
  vaId: propVaId,
  clientId: propClientId,
  jobId,
}: GenerateReviewModalProps) {
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';

  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: crmClients = [] } = useCrmClientUsersQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery();

  const crmClientRefs = useMemo(
    () => new Set(crmClients.map(c => c.clientRef).filter(Boolean)),
    [crmClients]
  );
  const filteredClients = useMemo(
    () => atsClients.filter(c => crmClientRefs.has(c.id)),
    [atsClients, crmClientRefs]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: propClientId ?? '',
      vaId: propVaId ?? '',
      jobDescription: defaultJobDescription,
      managerNotes: '',
      clientExpectations: '',
    },
  });

  const selectedClientId = useWatch({ control, name: 'clientId' });
  const selectedVaId = useWatch({ control, name: 'vaId' });

  // VAs who have an active assignment with the selected client
  const clientVas = useMemo(() => {
    if (!selectedClientId) return [];
    const candidateIds = new Set(
      assignments
        .filter(a => a.clientId === selectedClientId)
        .map(a => a.candidateId)
    );
    return crmVAs.filter(v => v.candidateRef && candidateIds.has(v.candidateRef));
  }, [selectedClientId, assignments, crmVAs]);

  // Role types available for the selected VA under the selected client
  const availableRoleTypes = useMemo(() => {
    if (!selectedVaId || !selectedClientId) return ROLE_TYPES;
    const matchingTypes = assignments
      .filter(a => a.clientId === selectedClientId && a.candidateId === selectedVaId && a.serviceType)
      .map(a => a.serviceType as RoleType)
      .filter(t => ROLE_TYPES.includes(t));
    return matchingTypes.length > 0 ? [...new Set(matchingTypes)] : ROLE_TYPES;
  }, [selectedVaId, selectedClientId, assignments]);

  // Auto-select role type when VA+client combo has exactly one assignment serviceType
  useEffect(() => {
    if (availableRoleTypes.length === 1 && availableRoleTypes[0] !== undefined) {
      setValue('roleType', availableRoleTypes[0]);
    }
  }, [availableRoleTypes, setValue]);

  // Reset VA when client changes (unless pre-populated)
  useEffect(() => {
    if (!propVaId) setValue('vaId', '');
  }, [selectedClientId, propVaId, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      const review = await generateReview({
        ...values,
        managerNotes: values.managerNotes ?? '',
        jobId,
        candidateName: defaultCandidateName || undefined,
        clientName: defaultClientName || undefined,
        jobTitle: defaultJobTitle || undefined,
      });
      toast.success('Review generated successfully');
      reset();
      onOpenChange(false);
      navigate(`${rolePrefix}/performance-reviews/${review.id}`);
    } catch {
      toast.error('Failed to generate review. Please try again.');
    }
  }

  function handleClose(open: boolean) {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) reset();
    }
  }

  const isPreFilled = !!(propVaId && propClientId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Generate Performance Review
          </DialogTitle>
          <DialogDescription>
            AI will generate a customized review template. This takes 15–30
            seconds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-3">
          {/* Pre-filled context (read-only) */}
          {(defaultCandidateName || defaultClientName || defaultJobTitle) && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              {defaultCandidateName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">VA / Candidate</p>
                  <p className="text-sm font-medium truncate">{defaultCandidateName}</p>
                </div>
              )}
              {defaultClientName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="text-sm font-medium truncate">{defaultClientName}</p>
                </div>
              )}
              {defaultJobTitle && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Job Title</p>
                  <p className="text-sm font-medium truncate">{defaultJobTitle}</p>
                </div>
              )}
            </div>
          )}

          {/* Cascading Client → VA selectors (hidden when both are pre-populated) */}
          {!isPreFilled && (
            <div className="grid grid-cols-2 gap-4">
              {/* Client first */}
              {!propClientId && (
                <div className="space-y-2.5">
                  <Label className="mb-2 block">Client *</Label>
                  <Controller
                    control={control}
                    name="clientId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.clientId ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClients.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.clientId && (
                    <p className="text-xs text-destructive">{errors.clientId.message}</p>
                  )}
                </div>
              )}

              {/* VA — filtered by selected client's assignments */}
              {!propVaId && (
                <div className="space-y-2.5">
                  <Label className="mb-2 block">VA *</Label>
                  <Controller
                    control={control}
                    name="vaId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedClientId}
                      >
                        <SelectTrigger className={errors.vaId ? 'border-destructive' : ''}>
                          <SelectValue placeholder={selectedClientId ? 'Select VA' : 'Select client first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {clientVas.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              No VAs assigned to this client
                            </div>
                          ) : (
                            clientVas.map(v => (
                              <SelectItem key={v.candidateRef!} value={v.candidateRef!}>
                                {v.firstName} {v.lastName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.vaId && (
                    <p className="text-xs text-destructive">{errors.vaId.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Review Type + Role Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="mb-2 block">Review Type *</Label>
              <Controller
                control={control}
                name="reviewType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.reviewType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.reviewType && (
                <p className="text-xs text-destructive">{errors.reviewType.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="mb-2 block">Role Type *</Label>
              <Controller
                control={control}
                name="roleType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.roleType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoleTypes.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleType && (
                <p className="text-xs text-destructive">{errors.roleType.message}</p>
              )}
            </div>
          </div>

          {/* Review Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="mb-2 block">Period Start *</Label>
              <Controller
                control={control}
                name="reviewPeriodStart"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Pick start date"
                  />
                )}
              />
              {errors.reviewPeriodStart && (
                <p className="text-xs text-destructive">{errors.reviewPeriodStart.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="mb-2 block">Period End *</Label>
              <Controller
                control={control}
                name="reviewPeriodEnd"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Pick end date"
                  />
                )}
              />
              {errors.reviewPeriodEnd && (
                <p className="text-xs text-destructive">{errors.reviewPeriodEnd.message}</p>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2.5">
            <Label className="mb-2 block">Job Description *</Label>
            <Textarea
              {...register('jobDescription')}
              placeholder="Describe the VA's role and responsibilities..."
              rows={4}
              className={errors.jobDescription ? 'border-destructive' : ''}
            />
            {errors.jobDescription && (
              <p className="text-xs text-destructive">{errors.jobDescription.message}</p>
            )}
          </div>

          {/* Client Expectations */}
          <div className="space-y-2.5">
            <Label className="mb-2 block">Client Expectations *</Label>
            <Textarea
              {...register('clientExpectations')}
              placeholder="What does the client expect from this VA?"
              rows={3}
              className={errors.clientExpectations ? 'border-destructive' : ''}
            />
            {errors.clientExpectations && (
              <p className="text-xs text-destructive">{errors.clientExpectations.message}</p>
            )}
          </div>

          {/* Manager Notes */}
          <div className="space-y-2.5">
            <Label className="mb-2 block">Manager Notes</Label>
            <Textarea
              {...register('managerNotes')}
              placeholder="Any additional context for the AI..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Generating AI Review…
                </>
              ) : (
                <>
                  <SparklesIcon className="size-4" />
                  Generate Review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
