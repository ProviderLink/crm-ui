import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { UpdateVaProfilePayload, WorkloadLevel } from '@/types/va-profile';

import { useCompanyDay } from '@/hooks/queries';
import { dateKeyToLocalDate } from '@/lib/time';

import { toISO, toYMD } from '../date-utils';
import { Field } from '../field';
import { EditActions, ScoreSelect } from './parts';
import type { ProfileEditor } from './use-profile-editor';

/** A yes/no choice stored as a boolean flag. */
function RiskSelect({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (flagged: boolean) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={v => onChange(v === 'true')}>
      <SelectTrigger className="h-9 rounded-xl text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="false">No</SelectItem>
        <SelectItem value="true">At risk</SelectItem>
      </SelectContent>
    </Select>
  );
}

/** The edit form of a VA's CRM profile. */
export function VaProfileForm({
  editor,
}: {
  editor: ProfileEditor<UpdateVaProfilePayload>;
}) {
  const { value, set } = editor;
  const { today } = useCompanyDay();

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-3">
      <Field label="Workload">
        <Select
          value={value('workloadLevel') ?? 'normal'}
          onValueChange={v => set('workloadLevel', v as WorkloadLevel)}
        >
          <SelectTrigger className="h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="overloaded">Overloaded</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Satisfaction (1-5)">
        <ScoreSelect
          value={value('satisfactionScore')}
          onChange={score => set('satisfactionScore', score)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Burnout Risk">
          <RiskSelect
            value={value('burnoutRiskFlag') ?? false}
            onChange={flagged => set('burnoutRiskFlag', flagged)}
          />
        </Field>
        <Field label="Replacement Risk">
          <RiskSelect
            value={value('replacementRiskFlag') ?? false}
            onChange={flagged => set('replacementRiskFlag', flagged)}
          />
        </Field>
      </div>

      <Field label="Last Check-in">
        <DatePickerField
          value={toYMD(value('lastVaCheckin'))}
          onChange={v => set('lastVaCheckin', toISO(v))}
          placeholder="Pick date"
          toDate={dateKeyToLocalDate(today) ?? undefined}
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
