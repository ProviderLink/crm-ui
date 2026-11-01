import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { SurveyStatusPill } from '@/components/shared/badges';
import { isOpen } from '@/lib/survey';
import {
  SURVEY_TYPE_LABELS,
  type ISurveyReminder,
} from '@/types/survey-reminder';

import {
  ReminderDueCell,
  ReminderForCell,
  type RelatedInfo,
} from '@/features/reminders/reminder-cells';

export function buildCheckinColumns({
  relatedInfo,
  today,
  busyId,
  onDone,
  onSkip,
}: {
  relatedInfo: Map<string, RelatedInfo>;
  today: string;
  busyId: string | null;
  onDone: (r: ISurveyReminder) => void;
  onSkip: (r: ISurveyReminder) => void;
}): ColumnDef<ISurveyReminder>[] {
  return [
    {
      accessorKey: 'relatedType',
      header: () => <span className="normal-case">For</span>,
      // Takes all the spare width; long names truncate inside it.
      meta: { fill: true, cellClassName: 'max-w-0' },
      enableSorting: false,
      cell: ({ row }) => (
        <ReminderForCell
          reminder={row.original}
          info={relatedInfo.get(row.original.relatedId)}
        />
      ),
    },
    {
      accessorKey: 'surveyType',
      header: 'Check-in',
      size: 130,
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {SURVEY_TYPE_LABELS[getValue<ISurveyReminder['surveyType']>()] ??
            getValue<string>()}{' '}
          check-in
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due date',
      size: 160,
      cell: ({ row }) => (
        <ReminderDueCell reminder={row.original} today={today} />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 110,
      cell: ({ getValue }) => {
        const s = getValue<ISurveyReminder['status']>();
        return <SurveyStatusPill status={s} />;
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { shrink: true },
      cell: ({ row }) => {
        const r = row.original;
        if (!isOpen(r)) return null;
        const busy = busyId === r._id;
        return (
          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={busy}
              onClick={() => onDone(r)}
            >
              Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground"
              disabled={busy}
              onClick={() => onSkip(r)}
            >
              Skip
            </Button>
          </div>
        );
      },
    },
  ];
}
