import { useSearchParams } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ReviewsTab } from './performance/ReviewsTab';
import { ScorecardsTab } from './performance/ScorecardsTab';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

export default function AmPerformancePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'scorecards' ? 'scorecards' : 'reviews';

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Performance
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Reviews and weekly scorecards for your assigned VAs
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={v =>
              setParams(v === 'scorecards' ? { tab: 'scorecards' } : {}, {
                replace: true,
              })
            }
          >
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="reviews" className={TAB}>
                Reviews
              </TabsTrigger>
              <TabsTrigger value="scorecards" className={TAB}>
                Scorecards
              </TabsTrigger>
            </TabsList>

            <div className="mt-4" />

            <TabsContent value="reviews" className="mt-0">
              <ReviewsTab />
            </TabsContent>
            <TabsContent value="scorecards" className="mt-0">
              <ScorecardsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
