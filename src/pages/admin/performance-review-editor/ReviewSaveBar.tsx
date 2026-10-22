import { CheckCircle2Icon, Loader2Icon, SaveIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ReviewSaveBar({
  saving,
  onSave,
  onComplete,
}: {
  saving: boolean;
  onSave: () => void;
  onComplete: () => void;
}) {
  return (
            <div className="flex justify-end gap-2 py-2 pb-8">
              <Button
                size="sm"
                variant="outline"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                Save Draft
              </Button>
              <Button size="sm" onClick={onComplete}>
                <CheckCircle2Icon className="size-4" />
                Mark Completed
              </Button>
            </div>
  );
}
