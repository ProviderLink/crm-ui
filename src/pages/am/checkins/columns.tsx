import type { ColumnDef } from '@tanstack/react-table';
import { Building2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDateKeyLong } from '@/lib/time';
import { SURVEY_STATUS_STYLES } from '@/lib/status-styles';
import type { ISurveyReminder } from '@/types/survey-reminder';

import { initialsOf } from '../../admin/work-entries/format';
import {
  daysUntil,
  dueKey,
  isOpen,
  plural,
  SURVEY_TYPE_LABELS,
} from './helpers';
import type { RelatedInfo } from './use-am-checkins';

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
      cell: ({ row }) => {
        const { relatedId, relatedType } = row.original;
        const info = relatedInfo.get(relatedId);
        const title = info?.title ?? `…${relatedId.slice(-8)}`;
        const subtitle = info?.subtitle ?? relatedType;
        return (
          <div className="flex min-w-0 items-center gap-3" title={`${title} · ${subtitle}`}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
              {info && !info.isCompany ? (
                initialsOf(info.title) || '?'
              ) : (
                <Building2Icon className="size-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-medium ${info ? '' : 'font-mono'}`}>
                {title}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {subtitle}
              </p>
            </div>
          </div>
        );
      },
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
      cell: ({ row }) => {
        const v = dueKey(row.original);
        if (!v) return <span className="text-muted-foreground/40">—</span>;
        let note: string | null = null;
        let noteClass = 'text-muted-foreground';
        if (isOpen(row.original)) {
          const d = daysUntil(v, today);
          if (d < 0) {
            note = `Overdue by ${plural(-d, 'day')}`;
            noteClass = 'text-destructive';
          } else if (d === 0) {
            note = 'Due today';
            noteClass = 'text-status-warning';
          } else {
            note = `In ${plural(d, 'day')}`;
          }
        }
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm">{formatDateKeyLong(v)}</p>
            {note && <p className={`text-xs ${noteClass}`}>{note}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 110,
      cell: ({ getValue }) => {
        const s = getValue<ISurveyReminder['status']>();
        return (
          <span
            className={`rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap capitalize ${SURVEY_STATUS_STYLES[s]}`}
          >
            {s}
          </span>
        );
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
