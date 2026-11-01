import { useState } from 'react';

import { useGenerateScorecards } from '@/hooks/mutations';

/** "Generate scorecards": confirm first, then run, keeping the error to show. */
export function useScorecardGenerate() {
  const generate = useGenerateScorecards();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function confirm() {
    setConfirmOpen(false);
    await generate.run();
  }

  return {
    confirmOpen,
    setConfirmOpen,
    generating: generate.isPending,
    error: generate.error,
    confirm,
  };
}
