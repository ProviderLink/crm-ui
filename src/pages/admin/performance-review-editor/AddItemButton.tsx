import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AddItemButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <PlusIcon className="size-3" />
      Add
    </Button>
  );
}
