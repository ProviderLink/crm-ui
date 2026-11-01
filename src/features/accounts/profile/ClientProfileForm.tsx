import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  HealthStatus,
  UpdateClientAccountPayload,
} from '@/types/client-account';

import { toISO, toYMD } from '../date-utils';
import { Field } from '../field';
import { EditActions, ScoreSelect } from './parts';
import type { ProfileEditor } from './use-profile-editor';

const STATUS_FLAGS = [
  { key: 'baaSigned', label: 'BAA Signed' },
  { key: 'onboardingComplete', label: 'Onboarding Complete' },
  { key: 'sopReceived', label: 'SOP Received' },
] as const;

/** The edit form of a client's CRM profile. */
export function ClientProfileForm({
  editor,
}: {
  editor: ProfileEditor<UpdateClientAccountPayload>;
}) {
  const { value, set } = editor;

  return (
    <div className="space-y-3">
      <Field label="Health Status">
        <Select
          value={value('healthStatus') ?? 'green'}
          onValueChange={v => set('healthStatus', v as HealthStatus)}
        >
          <SelectTrigger className="h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="green">🟢 Green</SelectItem>
            <SelectItem value="yellow">🟡 Yellow</SelectItem>
            <SelectItem value="red">🔴 Red</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Satisfaction (1-5)">
        <ScoreSelect
          value={value('satisfactionScore')}
          onChange={score => set('satisfactionScore', score)}
        />
      </Field>

      <Field label="EMR System">
        <Input
          value={value('emrSystem') ?? ''}
          onChange={e => set('emrSystem', e.target.value)}
          placeholder="e.g. Epic, Cerner"
          className="h-9 rounded-xl text-sm"
        />
      </Field>

      <Field label="Service Start Date">
        <DatePickerField
          value={toYMD(value('serviceStartDate'))}
          onChange={v => set('serviceStartDate', toISO(v))}
          placeholder="Pick date"
        />
      </Field>

      <div className="space-y-2.5 rounded-lg border border-white/[0.1] px-3 py-3">
        <span className="text-sm font-semibold text-foreground">
          Status Flags
        </span>
        {STATUS_FLAGS.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={Boolean(value(key))}
              onCheckedChange={v => set(key, Boolean(v))}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      {Boolean(value('baaSigned')) && (
        <Field label="BAA Signed Date">
          <DatePickerField
            value={toYMD(value('baaSignedDate'))}
            onChange={v => set('baaSignedDate', toISO(v))}
            placeholder="Pick date"
          />
        </Field>
      )}

      <Field label="Last Check-in">
        <DatePickerField
          value={toYMD(value('lastClientCheckin'))}
          onChange={v => set('lastClientCheckin', toISO(v))}
          placeholder="Pick date"
        />
      </Field>

      <Field label="Open Issues">
        <Input
          type="number"
          min={0}
          value={String(value('openIssuesCount') ?? 0)}
          onChange={e =>
            set('openIssuesCount', Math.max(0, Number(e.target.value)))
          }
          className="h-9 rounded-xl text-sm"
        />
      </Field>

      <Field label="Notes">
        <Textarea
          value={value('notes') ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Internal notes…"
          className="resize-none rounded-xl text-sm"
          rows={2}
        />
      </Field>

      <EditActions
        saving={editor.saving}
        success={editor.success}
        error={editor.error}
        onSave={editor.submit}
        onCancel={editor.cancel}
      />
    </div>
  );
}
