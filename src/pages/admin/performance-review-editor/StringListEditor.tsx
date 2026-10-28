import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function StringListEditor({
  items,
  onChange,
  placeholder,
  emptyMessage,
  readOnly,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: (index: number) => string;
  emptyMessage: React.ReactNode;
  readOnly: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={e => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder(i)}
            disabled={readOnly}
            className="h-9 text-sm"
          />
          {!readOnly && (
            <Button
              size="icon"
              aria-label="Remove item"
              variant="ghost"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
