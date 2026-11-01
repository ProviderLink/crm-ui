import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  GaugeIcon,
  MailIcon,
  MonitorIcon,
  PhoneIcon,
} from 'lucide-react';

import type { HealthStatus, IClientAccount } from '@/types/client-account';

import { fmtDate } from '../date-utils';
import {
  DetailRow,
  ProfileBlock,
  ProfileStats,
  RingChip,
  SatisfactionStars,
  type RingTone,
} from './parts';

const HEALTH: Record<HealthStatus, { label: string; tone: RingTone }> = {
  green: { label: 'Healthy', tone: 'success' },
  yellow: { label: 'At Risk', tone: 'warning' },
  red: { label: 'Critical', tone: 'error' },
};

const CONTACT_LINK =
  'flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground';

/** A client's CRM profile, read-only. */
export function ClientProfileView({
  account,
  vaCount,
  activeAssignments,
  totalAssignments,
}: {
  account: IClientAccount;
  vaCount: number;
  activeAssignments: number;
  totalAssignments: number;
}) {
  const health = HEALTH[account.healthStatus] ?? HEALTH.green;
  const hasDetails =
    account.emrSystem ||
    account.serviceStartDate ||
    account.lastClientCheckin ||
    account.openIssuesCount > 0;

  return (
    <div className="space-y-3">
      <ProfileStats
        items={[
          { label: 'VAs Hired', value: vaCount },
          { label: 'Active Assignments', value: activeAssignments },
          { label: 'Total Assignments', value: totalAssignments },
        ]}
      />

      {/* Health + Satisfaction */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <GaugeIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Health</span>
          <RingChip tone={health.tone}>{health.label}</RingChip>
        </div>
        <SatisfactionStars score={account.satisfactionScore} />
      </div>

      {(account.primaryContact || account.primaryContactEmail) && (
        <ProfileBlock title="Primary Contact">
          <div className="space-y-1">
            {account.primaryContact && (
              <p className="text-sm font-medium">{account.primaryContact}</p>
            )}
            {account.primaryContactEmail && (
              <a
                href={`mailto:${account.primaryContactEmail}`}
                className={CONTACT_LINK}
              >
                <MailIcon className="size-3" />
                {account.primaryContactEmail}
              </a>
            )}
            {account.primaryContactPhone && (
              <a
                href={`tel:${account.primaryContactPhone}`}
                className={CONTACT_LINK}
              >
                <PhoneIcon className="size-3" />
                {account.primaryContactPhone}
              </a>
            )}
          </div>
        </ProfileBlock>
      )}

      <ProfileBlock title="Compliance">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'BAA Signed', done: account.baaSigned },
            { label: 'Onboarding', done: account.onboardingComplete },
            { label: 'SOP Received', done: account.sopReceived },
          ].map(({ label, done }) => (
            <RingChip
              key={label}
              tone={done ? 'success' : 'muted'}
              padding="py-1"
            >
              {done ? (
                <CheckCircle2Icon className="size-3" />
              ) : (
                <CircleDashedIcon className="size-3" />
              )}
              {label}
            </RingChip>
          ))}
        </div>
      </ProfileBlock>

      <ProfileBlock title="Details" className="space-y-2">
        {account.emrSystem && (
          <DetailRow
            icon={
              <MonitorIcon className="size-3.5 shrink-0 text-muted-foreground" />
            }
            label="EMR"
            value={account.emrSystem}
          />
        )}
        {account.serviceStartDate && (
          <DetailRow
            icon={
              <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            }
            label="Service Start"
            value={fmtDate(account.serviceStartDate)}
          />
        )}
        {account.lastClientCheckin && (
          <DetailRow
            icon={
              <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
            }
            label="Last Check-in"
            value={fmtDate(account.lastClientCheckin)}
          />
        )}
        {account.openIssuesCount > 0 && (
          <DetailRow
            icon={
              <AlertTriangleIcon className="size-3.5 shrink-0 text-status-warning" />
            }
            label="Open Issues"
            value={account.openIssuesCount}
            valueClassName="font-medium text-status-warning"
          />
        )}
        {!hasDetails && (
          <p className="text-xs text-muted-foreground italic">
            No details yet.
          </p>
        )}
      </ProfileBlock>

      {account.notes && (
        <ProfileBlock title="Notes" tight>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {account.notes}
          </p>
        </ProfileBlock>
      )}
    </div>
  );
}
