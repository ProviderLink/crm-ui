import { WORK_ENTRY_STATUS_STYLES } from '@/lib/status-styles';
import type { WorkEntryStatus } from '@/types/work-entry';

import { statusLabel } from './format';

export function StatusPill({ status }: { status: WorkEntryStatus }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${WORK_ENTRY_STATUS_STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
