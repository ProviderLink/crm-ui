import { Trash2Icon } from 'lucide-react';

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
    return (
      <p className="text-sm text-muted-foreground italic py-1">
        {emptyMessage}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-none size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium select-none">
            {i + 1}
          </span>
          <Input
            value={item}
            onChange={e => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder(i)}
            disabled={readOnly}
            className="h-8 text-sm"
          />
          {!readOnly && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
