import { Loader2Icon, SparklesIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AiButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <SparklesIcon className="size-3.5" />
      )}
      {loading ? 'Working…' : label}
    </Button>
  );
}
