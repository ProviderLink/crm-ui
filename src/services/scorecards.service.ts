import type { IScorecard } from '@/types/scorecard';

/**
 * TODO: ats-crm-backend does not have a /scorecards resource.
 * Scorecard generation was handled by the old crm-backend.
 * Re-implement once the feature is ported to ats-crm-backend.
 */

export async function getScorecards(_vaId?: string): Promise<IScorecard[]> {
  return [];
}

export async function generateScorecards(): Promise<void> {
  // no-op — not yet implemented in ats-crm-backend
}
