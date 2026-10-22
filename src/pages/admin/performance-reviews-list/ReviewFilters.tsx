import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REVIEW_STATUSES } from '@/types/performance-review';

interface VaOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClientOption {
  id: string;
  companyName: string;
}

export function ReviewFilters({
  vaFilter,
  onVaChange,
  clientFilter,
  onClientChange,
  statusFilter,
  onStatusChange,
  vas,
  clients,
  recordCount,
  isAccountManager,
}: {
  vaFilter: string;
  onVaChange: (v: string) => void;
  clientFilter: string;
  onClientChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  vas: VaOption[];
  clients: ClientOption[];
  recordCount: number;
  isAccountManager: boolean;
}) {
  return (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VA</span>
              <Select value={vaFilter} onValueChange={onVaChange}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VAs</SelectItem>
                  {vas.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.firstName} {v.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Client</span>
              <Select value={clientFilter} onValueChange={onClientChange}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {REVIEW_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(vaFilter !== 'all' ||
              clientFilter !== 'all' ||
              statusFilter !== 'all') && (
              <button
                onClick={() => {
                  onVaChange('all');
                  onClientChange('all');
                  onStatusChange('all');
                }}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear filters
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {recordCount} record{recordCount !== 1 ? 's' : ''}
            </span>
            {isAccountManager && (
              <span className="text-[11px] text-muted-foreground/60 ml-1">
                (your assignments)
              </span>
            )}
          </div>
  );
}
