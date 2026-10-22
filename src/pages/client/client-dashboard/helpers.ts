import { formatDateKeyShort } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

export function tenureLabel(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (months < 1) return '< 1 month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years}y ${rem}mo`
    : `${years} year${years > 1 ? 's' : ''}`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const formatMonthDay = formatDateKeyShort;

export const assignmentBadge: Record<
  IAssignment['status'],
  { className: string; label: string }
> = {
  active: {
    className: 'border-green-500/40 text-green-400 bg-green-500/10',
    label: 'Active',
  },
  on_hold: {
    className: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
    label: 'On Hold',
  },
  ended: {
    className: 'border-muted text-muted-foreground bg-transparent',
    label: 'Ended',
  },
};
