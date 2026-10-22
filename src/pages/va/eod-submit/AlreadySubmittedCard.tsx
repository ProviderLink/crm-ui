import { CheckCircle2 } from 'lucide-react';

export function AlreadySubmittedCard({
  dateLabel,
  onViewHistory,
}: {
  dateLabel: string;
  onViewHistory: () => void;
}) {
  return (
        <div className="bg-card rounded-lg border border-border p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
            <CheckCircle2 size={28} className="text-text-secondary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              EOD already submitted for{' '}
              {dateLabel}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You're all done for the day. Great work!
            </p>
          </div>
          <button
            onClick={onViewHistory}
            className="text-sm text-text-secondary hover:text-white underline-offset-4"
          >
            View EOD History →
          </button>
        </div>
  );
}
