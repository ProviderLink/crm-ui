import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
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
import { useAppSelector } from '@/hooks/store';
import { generateReview } from '@/services/performance-reviews.service';
import {
  REVIEW_TYPES,
  ROLE_TYPES,
  type ReviewType,
  type RoleType,
} from '@/types/performance-review';

const schema = z.object({
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
  vaId,
  clientId,
  jobId,
}: GenerateReviewModalProps) {
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobDescription: defaultJobDescription,
      managerNotes: '',
      clientExpectations: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const review = await generateReview({
        ...values,
        managerNotes: values.managerNotes ?? '',
        vaId,
        clientId,
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
                  <p className="text-xs text-muted-foreground mb-1">
                    VA / Candidate
                  </p>
                  <p className="text-sm font-medium truncate">
                    {defaultCandidateName}
                  </p>
                </div>
              )}
              {defaultClientName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="text-sm font-medium truncate">
                    {defaultClientName}
                  </p>
                </div>
              )}
              {defaultJobTitle && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Job Title
                  </p>
                  <p className="text-sm font-medium truncate">
                    {defaultJobTitle}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Review Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="mb-2 block">Review Type *</Label>
              <Controller
                control={control}
                name="reviewType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.reviewType ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_TYPES.map(t => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.reviewType && (
                <p className="text-xs text-destructive">
                  {errors.reviewType.message}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="mb-2 block">Role Type *</Label>
              <Controller
                control={control}
                name="roleType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.roleType ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_TYPES.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleType && (
                <p className="text-xs text-destructive">
                  {errors.roleType.message}
                </p>
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
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Pick start date"
                  />
                )}
              />
              {errors.reviewPeriodStart && (
                <p className="text-xs text-destructive">
                  {errors.reviewPeriodStart.message}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="mb-2 block">Period End *</Label>
              <Controller
                control={control}
                name="reviewPeriodEnd"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Pick end date"
                  />
                )}
              />
              {errors.reviewPeriodEnd && (
                <p className="text-xs text-destructive">
                  {errors.reviewPeriodEnd.message}
                </p>
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
              <p className="text-xs text-destructive">
                {errors.jobDescription.message}
              </p>
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
              <p className="text-xs text-destructive">
                {errors.clientExpectations.message}
              </p>
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
