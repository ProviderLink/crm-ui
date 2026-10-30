import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
  useEodContextQuery,
  useSurveyRemindersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { todayString } from '@/lib/time';
import type { ISurveyReminder } from '@/types/survey-reminder';

import { dueKey, daysUntil, isOpen } from './helpers';

export type RelatedInfo = {
  title: string;
  subtitle: string;
  isCompany: boolean;
};

/**
 * The manager's check-ins. The backend already limits them to this manager's
 * own; the names come from the manager's assignments, so no admin-only list
 * is needed.
 */
export function useAmCheckins() {
  const user = useAppSelector(s => s.auth.user);
  // Due dates are company business days, so judge "overdue" against the
  // company's current day, not the device clock.
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();

  const { data: reminders = [], isLoading: loadingReminders } =
    useSurveyRemindersQuery();
  const { data: assignments = [], isLoading: loadingAssignments } =
    useAllAssignmentsQuery(user?.id);

  // What the "For" column shows for each related record: a main line and a
  // supporting line, so it reads as people and companies, not ids.
  const relatedInfo = useMemo(() => {
    const info = new Map<string, RelatedInfo>();
    for (const a of assignments) {
      const va = a.candidateName || 'VA';
      const client = a.companyName || '';
      info.set(a._id, { title: va, subtitle: client || 'Assignment', isCompany: false });
      info.set(a.candidateId, { title: va, subtitle: 'Virtual Assistant', isCompany: false });
      if (client)
        info.set(a.clientId, { title: client, subtitle: 'Client', isCompany: true });
    }
    return info;
  }, [assignments]);

  const groups = useMemo(() => {
    const open = reminders
      .filter(isOpen)
      .sort((a, b) => dueKey(a).localeCompare(dueKey(b)));
    const overdue: ISurveyReminder[] = [];
    const thisWeek: ISurveyReminder[] = [];
    const later: ISurveyReminder[] = [];
    for (const r of open) {
      const d = daysUntil(dueKey(r), today);
      if (d < 0) overdue.push(r);
      else if (d <= 7) thisWeek.push(r);
      else later.push(r);
    }
    // Finished ones, most recently due first.
    const done = reminders
      .filter(r => !isOpen(r))
      .sort((a, b) => dueKey(b).localeCompare(dueKey(a)));
    return { overdue, thisWeek, later, done, openCount: open.length };
  }, [reminders, today]);

  return {
    reminders,
    groups,
    relatedInfo,
    today,
    isLoading: loadingReminders || loadingAssignments,
  };
}
