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
      className="h-7 px-2.5 text-xs border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 gap-1.5"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2Icon className="size-3 animate-spin" />
      ) : (
        <SparklesIcon className="size-3" />
      )}
      {loading ? 'Working…' : label}
    </Button>
  );
}
