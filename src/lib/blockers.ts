import type { IEodSubmission } from '@/types/eod-submission';

/** A blocker field counts only when the VA wrote something other than "None". */
const NO_BLOCKER = /^(none|n\/a|na|no|nil|nothing|-+)\.?$/i;

export const hasBlocker = (e: Pick<IEodSubmission, 'blockers'>): boolean => {
  const text = e.blockers?.trim();
  return !!text && !NO_BLOCKER.test(text);
};

/** How far back a reported blocker still counts as one to follow up. */
export const BLOCKER_DAYS = 7;
