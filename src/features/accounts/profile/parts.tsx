import { Edit3Icon, StarIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** A block of a profile card, set off by a rule and a heading. */
export function ProfileBlock({
  title,
  tight = false,
  className,
  children,
}: {
  title: string;
  /** Less space under the heading, for running text. */
  tight?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('border-t border-border pt-4', className)}>
      <p
        className={cn(
          'text-sm font-semibold text-foreground',
          tight ? 'mb-1.5' : 'mb-2'
        )}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

/** "CRM Profile" label with the Edit button on the right. */
export function ProfileHeader({
  canEdit,
  editing,
  onEdit,
}: {
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">CRM Profile</span>
      {canEdit && !editing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-lg text-xs"
          onClick={onEdit}
        >
          <Edit3Icon className="size-3" />
          Edit
        </Button>
      )}
    </div>
  );
}

/** Three big numbers with captions. */
export function ProfileStats({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] p-3"
        >
          <div>
            <p className="text-2xl leading-none font-semibold tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** An icon, a label and a value on one line. */
export function DetailRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('ml-auto text-xs', valueClassName)}>{value}</span>
    </div>
  );
}

/** Five stars, filled up to the score. */
export function SatisfactionStars({ score }: { score?: number | null }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-0.5 text-xs text-muted-foreground">Satisfaction</span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`size-3 ${i < (score ?? 0) ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/20'}`}
          />
        ))}
      </div>
    </div>
  );
}

const RING_TONES = {
  success: 'bg-white/[0.04] text-status-success ring-status-success/20',
  warning: 'bg-white/[0.04] text-status-warning ring-status-warning/20',
  error: 'bg-white/[0.04] text-status-error ring-status-error/20',
  info: 'bg-white/[0.04] text-status-info ring-status-info/20',
  muted: 'bg-white/[0.03] text-muted-foreground/60 ring-white/[0.06]',
  neutral: 'bg-white/[0.04] text-muted-foreground ring-white/[0.08]',
} as const;

export type RingTone = keyof typeof RING_TONES;

/** A small ringed label, used for health, workload and compliance flags. */
export function RingChip({
  tone,
  padding = 'py-0.5',
  children,
}: {
  tone: RingTone;
  padding?: 'py-0.5' | 'py-1';
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 ${padding} text-[11px] font-medium ring-1 ring-inset ${RING_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** The 1–5 (or none) choice used for satisfaction. */
export function ScoreSelect({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (score: number | null) => void;
}) {
  return (
    <Select
      value={value ? String(value) : '0'}
      onValueChange={v => onChange(Number(v) || null)}
    >
      <SelectTrigger className="h-9 rounded-xl text-sm">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">—</SelectItem>
        {[1, 2, 3, 4, 5].map(n => (
          <SelectItem key={n} value={String(n)}>
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Save and Cancel, with the error or "saved" message under them. */
export function EditActions({
  saving,
  success,
  error,
  onSave,
  onCancel,
}: {
  saving: boolean;
  success: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="rounded-xl"
          onClick={onSave}
          disabled={saving || success}
        >
          {saving ? 'Saving…' : success ? 'Saved!' : 'Save'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-status-success">
          Changes saved successfully.
        </p>
      )}
    </div>
  );
}
