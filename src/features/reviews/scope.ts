import type { IAssignment } from '@/types/assignment';
import type { IPerformanceReview } from '@/types/performance-review';

const pairKey = (vaId: string, clientId: string) => `${vaId}::${clientId}`;

/**
 * The reviews an account manager may see: those of a VA at a client that is
 * one of the manager's own assignments. Matching the VA *and* the client
 * keeps out another manager's VA at a client they share.
 */
export function reviewsInScope(
  reviews: IPerformanceReview[],
  assignments: IAssignment[]
): IPerformanceReview[] {
  const pairs = new Set(
    assignments.map(a => pairKey(a.candidateId, a.clientId))
  );
  return reviews.filter(r => pairs.has(pairKey(r.vaId, r.clientId)));
}
