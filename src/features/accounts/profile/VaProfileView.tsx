import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  GaugeIcon,
} from 'lucide-react';

import type { IVaProfile, WorkloadLevel } from '@/types/va-profile';

import { fmtDate } from '../date-utils';
import {
  DetailRow,
  ProfileBlock,
  RingChip,
  SatisfactionStars,
  type RingTone,
} from './parts';

const WORKLOAD_TONE: Record<WorkloadLevel, RingTone> = {
  low: 'success',
  normal: 'info',
  high: 'warning',
  overloaded: 'error',
};

/** A VA's CRM profile, read-only. */
export function VaProfileView({ profile }: { profile: IVaProfile }) {
  const risks = [
    {
      label: 'Burnout risk',
      clear: 'No burnout risk',
      flagged: profile.burnoutRiskFlag,
    },
    {
      label: 'Replacement risk',
      clear: 'No replacement risk',
      flagged: profile.replacementRiskFlag,
    },
  ];

  return (
    <>
      {/* Workload + Satisfaction */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <GaugeIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Workload</span>
          <RingChip tone={WORKLOAD_TONE[profile.workloadLevel] ?? 'neutral'}>
            {profile.workloadLevel.charAt(0).toUpperCase() +
              profile.workloadLevel.slice(1)}
          </RingChip>
        </div>
        <SatisfactionStars score={profile.satisfactionScore} />
      </div>

      <ProfileBlock title="Risk Flags">
        <div className="flex flex-wrap gap-1.5">
          {risks.map(({ label, clear, flagged }) => (
            <RingChip
              key={label}
              tone={flagged ? 'error' : 'success'}
              padding="py-1"
            >
              {flagged ? (
                <AlertTriangleIcon className="size-3" />
              ) : (
                <CheckCircle2Icon className="size-3" />
              )}
              {flagged ? label : clear}
            </RingChip>
          ))}
        </div>
      </ProfileBlock>

      <ProfileBlock title="Details" className="space-y-2">
        <DetailRow
          icon={
            <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
          }
          label="Last Check-in"
          value={fmtDate(profile.lastVaCheckin)}
        />
      </ProfileBlock>

      {profile.notes && (
        <ProfileBlock title="Notes" tight>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {profile.notes}
          </p>
        </ProfileBlock>
      )}
    </>
  );
}
