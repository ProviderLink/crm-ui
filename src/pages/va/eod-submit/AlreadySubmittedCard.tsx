import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AlreadySubmittedCard({
  dateLabel,
  onViewHistory,
}: {
  dateLabel: string;
  onViewHistory: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
        <CheckCircle2 size={24} className="text-text-secondary" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          EOD already submitted for {dateLabel}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You're all done for the day. Great work!
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onViewHistory}>
        View EOD History
      </Button>
    </div>
  );
}
