import { Building2Icon } from 'lucide-react';

import { initialsOf, plural } from '@/lib/format';
import { dueKey, isOpen } from '@/lib/survey';
import { daysUntil, formatDateKeyLong } from '@/lib/time';
import type { ISurveyReminder } from '@/types/survey-reminder';

/** What a reminder is about, as a main line and a supporting line. */
export interface RelatedInfo {
  title: string;
  subtitle: string;
  /** A company rather than a person; shown with a building icon. */
  isCompany: boolean;
}

/** The "For" column: the person or company a reminder is about. */
export function ReminderForCell({
  reminder,
  info,
}: {
  reminder: ISurveyReminder;
  info?: RelatedInfo;
}) {
  const { relatedId, relatedType } = reminder;
  const title = info?.title ?? `…${relatedId.slice(-8)}`;
  const subtitle = info?.subtitle ?? relatedType;
  return (
    <div
      className="flex min-w-0 items-center gap-3"
      title={`${title} · ${subtitle}`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
        {info && !info.isCompany ? (
          initialsOf(info.title) || '?'
        ) : (
          <Building2Icon className="size-3.5" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-sm font-medium ${info ? '' : 'font-mono'}`}
        >
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground capitalize">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/** The due date, and for open reminders how far away or overdue it is. */
export function ReminderDueCell({
  reminder,
  today,
}: {
  reminder: ISurveyReminder;
  /** The company's current business day, `YYYY-MM-DD`. */
  today: string;
}) {
  const due = dueKey(reminder);
  if (!due) return <span className="text-muted-foreground/40">—</span>;

  let note: string | null = null;
  let noteClass = 'text-muted-foreground';
  if (isOpen(reminder)) {
    const days = daysUntil(due, today);
    if (days < 0) {
      note = `Overdue by ${plural(-days, 'day')}`;
      noteClass = 'text-destructive';
    } else if (days === 0) {
      note = 'Due today';
      noteClass = 'text-status-warning';
    } else {
      note = `In ${plural(days, 'day')}`;
    }
  }
  return (
    <div className="whitespace-nowrap">
      <p className="text-sm">{formatDateKeyLong(due)}</p>
      {note && <p className={`text-xs ${noteClass}`}>{note}</p>}
    </div>
  );
}
