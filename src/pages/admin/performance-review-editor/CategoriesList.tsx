import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RATING_LABELS, type IPerformanceCategory } from '@/types/performance-review';

import {
  RATING_COLORS,
  RATING_OPTIONS,
  ratingToValue,
  valueToRating,
} from './rating';

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
              <div className="space-y-3">
                {categories
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="rounded-lg border border-border/50 bg-background p-4"
                    >
                      {/* Category header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="flex-none mt-0.5 size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium select-none">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">
                              {cat.categoryName}
                            </p>
                            {cat.categoryDescription && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {cat.categoryDescription}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rating select + badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          {cat.rating !== null && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${RATING_COLORS[cat.rating] ?? ''}`}
                            >
                              {cat.rating} · {RATING_LABELS[cat.rating]}
                            </span>
                          )}
                          <Select
                            value={ratingToValue(cat.rating)}
                            onValueChange={v =>
                              onChangeField(
                                cat.id,
                                'rating',
                                valueToRating(v)
                              )
                            }
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
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
                      </div>

                      {/* Manager comments */}
                      <Textarea
                        value={cat.managerComments ?? ''}
                        onChange={e =>
                          onChangeField(
                            cat.id,
                            'managerComments',
                            e.target.value
                          )
                        }
                        rows={2}
                        placeholder="Manager comments for this category..."
                        className="text-sm resize-none bg-muted/30"
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
              </div>
  );
}
