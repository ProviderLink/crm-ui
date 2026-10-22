export const RATING_OPTIONS = [
  { value: '1', label: '1 — Unsatisfactory' },
  { value: '2', label: '2 — Needs Improvement' },
  { value: '3', label: '3 — Meets Expectations' },
  { value: '4', label: '4 — Exceeds Expectations' },
  { value: '5', label: '5 — Outstanding' },
  { value: 'na', label: 'N/A' },
];

export const RATING_COLORS: Record<number, string> = {
  1: 'bg-white/[0.04] text-[#F87171] border-[rgba(255,255,255,0.08)]',
  2: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  3: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  4: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  5: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
};

export function ratingToValue(r: number | null): string {
  if (r === null) return 'na';
  return String(r);
}

export function valueToRating(v: string): number | null {
  if (v === 'na' || v === '') return null;
  return parseInt(v, 10);
}
