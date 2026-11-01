import { Link } from 'react-router-dom';

import {
  ReviewStatusBadge,
  Score,
  SurveyStatusPill,
} from '@/components/shared/badges';
import { formatDate } from '@/lib/format';
import { isOpen } from '@/lib/survey';
import { formatDateKeyLong } from '@/lib/time';
import type { IPerformanceReview } from '@/types/performance-review';
import {
  SURVEY_TYPE_LABELS,
  type ISurveyReminder,
} from '@/types/survey-reminder';

/** The assignment's check-ins and performance reviews, with links to manage them. */
export function FollowUps({
  reminders,
  reviews,
  today,
}: {
  reminders: ISurveyReminder[];
  reviews: IPerformanceReview[];
  /** The company's current business day, `YYYY-MM-DD`. */
  today: string;
}) {
  return (
    <>
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Check-ins</h3>
          <Link
            to="/am/reminders"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage check-ins →
          </Link>
        </div>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No check-ins for this assignment.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-white/[0.1] bg-white/[0.03]">
            {reminders.map(r => {
              const due = r.dueDate?.slice(0, 10) ?? '';
              const late = isOpen(r) && due < today;
              return (
                <li
                  key={r._id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {SURVEY_TYPE_LABELS[r.surveyType] ?? r.surveyType}{' '}
                      check-in
                    </p>
                    <p
                      className={`text-xs ${late ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      Due {due ? formatDateKeyLong(due) : '—'}
                      {late && ' · overdue'}
                    </p>
                  </div>
                  <SurveyStatusPill status={r.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Reviews</h3>
          <Link
            to="/am/performance"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open reviews →
          </Link>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No performance reviews yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-white/[0.1] bg-white/[0.03]">
            {reviews.map(r => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm">{r.reviewType} review</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Score value={r.overallRating} withLabel />
                  <ReviewStatusBadge status={r.reviewStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
