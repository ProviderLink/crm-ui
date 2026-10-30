import { formatDateKeyShort } from '@/lib/time';

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
