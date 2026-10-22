import { CheckCircle2Icon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FINAL_RECOMMENDATIONS,
  RATING_LABELS,
  type FinalRecommendation,
} from '@/types/performance-review';

import { RATING_COLORS } from './rating';

export function FinalAssessmentCard({
  finalRecommendation,
  onRecommendationChange,
  overallRating,
  onRatingChange,
  isReadOnly,
}: {
  finalRecommendation: FinalRecommendation | '';
  onRecommendationChange: (v: FinalRecommendation) => void;
  overallRating: string;
  onRatingChange: (v: string) => void;
  isReadOnly: boolean;
}) {
  const ratingNum = overallRating ? parseInt(overallRating, 10) : null;
  return (
          <Card className="shadow-none border-border/60">
            <CardHeader className="px-5 py-4 pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="text-muted-foreground">
                  <CheckCircle2Icon className="size-3.5" />
                </span>
                Final Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Final Recommendation
                  </Label>
                  <Select
                    value={finalRecommendation}
                    onValueChange={v =>
                      onRecommendationChange(v as FinalRecommendation)
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINAL_RECOMMENDATIONS.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Overall Rating
                  </Label>
                  <Select
                    value={overallRating}
                    onValueChange={onRatingChange}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n} — {RATING_LABELS[n]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ratingNum !== null && (
                    <p
                      className={`text-xs font-medium ${RATING_COLORS[ratingNum]?.split(' ')[1] ?? ''}`}
                    >
                      {RATING_LABELS[ratingNum]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
  );
}
