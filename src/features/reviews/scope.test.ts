import { describe, expect, it } from 'vitest';

import type { IAssignment } from '@/types/assignment';
import type { IPerformanceReview } from '@/types/performance-review';

import { reviewsInScope } from './scope';

const assignment = (candidateId: string, clientId: string) =>
  ({ _id: `${candidateId}-${clientId}`, candidateId, clientId }) as IAssignment;
const review = (id: string, vaId: string, clientId: string) =>
  ({ id, vaId, clientId }) as IPerformanceReview;

describe('reviewsInScope', () => {
  const mine = [assignment('va1', 'c1')];

  it('keeps a review of my VA at my client', () => {
    expect(reviewsInScope([review('r1', 'va1', 'c1')], mine)).toHaveLength(1);
  });

  it("drops another manager's VA at a client I share", () => {
    expect(reviewsInScope([review('r2', 'va2', 'c1')], mine)).toHaveLength(0);
  });

  it('drops my VA at a client that is not mine', () => {
    expect(reviewsInScope([review('r3', 'va1', 'c2')], mine)).toHaveLength(0);
  });

  it('is empty without assignments', () => {
    expect(reviewsInScope([review('r1', 'va1', 'c1')], [])).toEqual([]);
  });
});
