import type { IAssignment } from '@/types/assignment';

import { Pill } from '../accounts/badges';

const STATUS_TONE: Record<IAssignment['status'], 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  on_hold: 'warning',
  ended: 'neutral',
};

const STATUS_LABELS: Record<IAssignment['status'], string> = {
  active: 'Active',
  on_hold: 'On hold',
  ended: 'Ended',
};

export function AssignmentStatus({ status }: { status: IAssignment['status'] }) {
  return (
    <Pill tone={STATUS_TONE[status] ?? 'neutral'}>
      {STATUS_LABELS[status] ?? status}
    </Pill>
  );
}
