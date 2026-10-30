import { formatMinutes } from '@/lib/time';

// Shortcuts that fill a duration field; any value can still be typed.
const DURATION_PRESETS = [15, 30, 60, 120];

/** Quick-pick durations, plus the typed value read back as hours. */
export function DurationPresets({
  value,
  onPick,
}: {
  value: number | undefined;
  onPick: (minutes: number) => void;
}) {
  const valid = typeof value === 'number' && Number.isFinite(value) && value > 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">Quick:</span>
      {DURATION_PRESETS.map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onPick(m)}
          className={`h-7 rounded-md border px-2.5 text-xs transition-colors ${
            value === m
              ? 'border-border-strong bg-white/[0.08] text-foreground'
              : 'border-border text-muted-foreground hover:border-input hover:text-foreground'
          }`}
        >
          {formatMinutes(m)}
        </button>
      ))}
      {valid && (
        <span className="ml-2 text-xs tabular-nums text-muted-foreground">
          = {formatMinutes(value)}
        </span>
      )}
    </div>
  );
}
