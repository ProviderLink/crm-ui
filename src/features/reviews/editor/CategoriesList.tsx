import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { IPerformanceCategory } from '@/types/performance-review';

import { RATING_OPTIONS, ratingToValue, valueToRating } from './rating';

export function CategoriesList({
  categories,
  isReadOnly,
  onChangeField,
}: {
  categories: IPerformanceCategory[];
  isReadOnly: boolean;
  onChangeField: (
    catId: string,
    field: 'rating' | 'managerComments',
    value: number | null | string
  ) => void;
}) {
  return (
    <div className="divide-y divide-white/[0.08] rounded-lg border border-white/[0.1] bg-white/[0.03]">
      {categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => (
          <div key={cat.id} className="space-y-3 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {cat.categoryName}
                </p>
                {cat.categoryDescription && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {cat.categoryDescription}
                  </p>
                )}
              </div>
              <Select
                value={ratingToValue(cat.rating)}
                onValueChange={v =>
                  onChangeField(cat.id, 'rating', valueToRating(v))
                }
                disabled={isReadOnly}
              >
                <SelectTrigger
                  className="h-8 w-full shrink-0 text-xs sm:w-52"
                  aria-label={`Rating for ${cat.categoryName}`}
                >
                  <SelectValue placeholder="Set rating" />
                </SelectTrigger>
                <SelectContent>
                  {RATING_OPTIONS.map(o => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-xs"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={cat.managerComments ?? ''}
              onChange={e =>
                onChangeField(cat.id, 'managerComments', e.target.value)
              }
              rows={2}
              placeholder="Comments for this category…"
              className="resize-none text-sm"
              disabled={isReadOnly}
            />
          </div>
        ))}
    </div>
  );
}
