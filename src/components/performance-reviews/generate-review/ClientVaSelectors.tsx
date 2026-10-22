import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FormField } from './FormField';
import type { FormValues } from './schema';

interface ClientOption {
  id: string;
  companyName: string;
}

interface VaOption {
  candidateRef?: string | null;
  firstName: string;
  lastName: string;
}

export function ClientVaSelectors({
  control,
  errors,
  clients,
  vas,
  selectedClientId,
  showClient,
  showVa,
}: {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  clients: ClientOption[];
  vas: VaOption[];
  selectedClientId: string;
  showClient: boolean;
  showVa: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Client first */}
      {showClient && (
        <FormField label="Client *" error={errors.clientId?.message}>
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className={errors.clientId ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      )}

      {/* VA — filtered by selected client's assignments */}
      {showVa && (
        <FormField label="VA *" error={errors.vaId?.message}>
          <Controller
            control={control}
            name="vaId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!selectedClientId}
              >
                <SelectTrigger
                  className={errors.vaId ? 'border-destructive' : ''}
                >
                  <SelectValue
                    placeholder={
                      selectedClientId ? 'Select VA' : 'Select client first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vas.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No VAs assigned to this client
                    </div>
                  ) : (
                    vas.map(v => (
                      <SelectItem key={v.candidateRef!} value={v.candidateRef!}>
                        {v.firstName} {v.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      )}
    </div>
  );
}
