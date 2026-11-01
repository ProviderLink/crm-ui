import type { WorkEntryStatus } from '@/types/work-entry';

export const statusLabel = (s: WorkEntryStatus) =>
  s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1);
