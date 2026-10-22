import { Card, CardContent } from '@/components/ui/card';
import type { IPerformanceReview } from '@/types/performance-review';

export function ReviewMetadataCard({ review }: { review: IPerformanceReview }) {
  return (
          <Card className="shadow-none border-border/60 bg-muted/30">
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    VA / Candidate
                  </p>
                  <p className="text-sm font-medium">
                    {review.candidateName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                  <p className="text-sm font-medium">
                    {review.clientName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Review Period
                  </p>
                  <p className="text-sm font-medium">
                    {review.reviewPeriodStart?.slice(0, 10)} –{' '}
                    {review.reviewPeriodEnd?.slice(0, 10)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <p className="text-sm font-medium">{review.reviewStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
  );
}
