import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { Controller } from 'react-hook-form';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { REVIEW_TYPES } from '@/types/performance-review';

import { ClientVaSelectors } from './generate-review/ClientVaSelectors';
import { FormField } from './generate-review/FormField';
import { PrefilledContext } from './generate-review/PrefilledContext';
import { useGenerateReviewForm } from './generate-review/use-generate-review-form';

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
  const f = useGenerateReviewForm({
    onOpenChange,
    defaultCandidateName,
    defaultClientName,
    defaultJobTitle,
    defaultJobDescription,
    propVaId,
    propClientId,
    jobId,
  });
  const { control, errors, register } = f;

  return (
    <Dialog open={open} onOpenChange={f.handleClose}>
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

        <form onSubmit={f.handleSubmit(f.onSubmit)} className="space-y-5 mt-3">
          <PrefilledContext
            candidateName={defaultCandidateName}
            clientName={defaultClientName}
            jobTitle={defaultJobTitle}
          />

          {/* Cascading Client → VA selectors (hidden when both are pre-populated) */}
          {!f.isPreFilled && (
            <ClientVaSelectors
              control={control}
              errors={errors}
              clients={f.filteredClients}
              vas={f.clientVas}
              selectedClientId={f.selectedClientId}
              showClient={!propClientId}
              showVa={!propVaId}
            />
          )}

          {/* Review Type + Role Type */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Review Type *" error={errors.reviewType?.message}>
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
            </FormField>

            <FormField label="Role Type *" error={errors.roleType?.message}>
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
                      {f.availableRoleTypes.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          {/* Review Period */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Period Start *"
              error={errors.reviewPeriodStart?.message}
            >
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
            </FormField>

            <FormField
              label="Period End *"
              error={errors.reviewPeriodEnd?.message}
            >
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
            </FormField>
          </div>

          <FormField
            label="Job Description *"
            error={errors.jobDescription?.message}
          >
            <Textarea
              {...register('jobDescription')}
              placeholder="Describe the VA's role and responsibilities..."
              rows={4}
              className={errors.jobDescription ? 'border-destructive' : ''}
            />
          </FormField>

          <FormField
            label="Client Expectations *"
            error={errors.clientExpectations?.message}
          >
            <Textarea
              {...register('clientExpectations')}
              placeholder="What does the client expect from this VA?"
              rows={3}
              className={errors.clientExpectations ? 'border-destructive' : ''}
            />
          </FormField>

          <FormField label="Manager Notes">
            <Textarea
              {...register('managerNotes')}
              placeholder="Any additional context for the AI..."
              rows={3}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => f.handleClose(false)}
              disabled={f.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={f.isSubmitting}>
              {f.isSubmitting ? (
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
