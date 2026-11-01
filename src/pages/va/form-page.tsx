import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IAssignment } from '@/types/assignment';

/** A VA form page: a narrow column with a title and a one-line description. */
export function FormPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Page>
      <PageSection>
        <div className="max-w-3xl">
          <PageHeader title={title} description={description} />
          {children}
        </div>
      </PageSection>
    </Page>
  );
}

/** Placeholder shown while the form's data loads. */
export function FormPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Page>
      <PageSection>
        <div className="max-w-3xl">
          <div className="mb-6 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </PageSection>
    </Page>
  );
}

/** A centred message in place of the form (nothing to log against, or a failure). */
export function FormMessageCard({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'error';
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <p
        className={`text-sm ${tone === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * The assignment a report or entry belongs to. A lone assignment is shown as
 * plain text: setting it after mount races the Select registering its options,
 * which resets the field to "".
 */
export function AssignmentSelect<
  T extends FieldValues & { assignmentId: string },
>({
  control,
  assignments,
  narrow = false,
}: {
  control: Control<T>;
  assignments: IAssignment[];
  /** Half width on wider screens. */
  narrow?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={'assignmentId' as Path<T>}
      render={({ field }) => {
        const only = assignments.length === 1 ? assignments[0]! : null;
        if (only) {
          return (
            <div
              className={`flex h-10 min-w-0 flex-col justify-center rounded-md border border-border bg-white/[0.03] px-3 ${narrow ? 'sm:max-w-[calc(50%-0.5rem)]' : ''}`}
            >
              <span className="truncate text-sm leading-tight">
                {only.serviceType ?? only._id}
              </span>
              {only.companyName && (
                <span className="truncate text-xs leading-tight text-muted-foreground">
                  {only.companyName}
                </span>
              )}
            </div>
          );
        }
        return (
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignment" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(a => (
                <SelectItem key={a._id} value={a._id}>
                  <span className="flex flex-col">
                    <span>{a.serviceType ?? a._id}</span>
                    {a.companyName && (
                      <span className="text-xs text-muted-foreground">
                        {a.companyName}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );
}

/** Cancel and submit at the foot of a form. */
export function FormActions({
  submitting,
  submitLabel,
  submittingLabel,
  onCancel,
}: {
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting} className="gap-2">
        {submitting ? (
          <>
            <span className="size-3.5 animate-spin rounded-full border-2 border-text-inverse/30 border-t-text-inverse" />
            {submittingLabel}
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}
