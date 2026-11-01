import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FINAL_RECOMMENDATIONS,
  RATING_LABELS,
  type FinalRecommendation,
} from '@/types/performance-review';

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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Final recommendation
        </Label>
        <Select
          value={finalRecommendation}
          onValueChange={v => onRecommendationChange(v as FinalRecommendation)}
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

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Overall rating</Label>
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
      </div>
    </div>
  );
}
