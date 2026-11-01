import { useSearchParams } from 'react-router-dom';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import { ReviewsTab } from './performance/ReviewsTab';
import { ScorecardsTab } from './performance/ScorecardsTab';

export default function AmPerformancePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'scorecards' ? 'scorecards' : 'reviews';

  return (
    <Page>
      <PageSection>
        <PageHeader
          title="Performance"
          description="Reviews and weekly scorecards for your assigned VAs"
        />

        <Tabs
          value={tab}
          onValueChange={v =>
            setParams(v === 'scorecards' ? { tab: 'scorecards' } : {}, {
              replace: true,
            })
          }
        >
          <UnderlineTabsList>
            <UnderlineTab value="reviews">Reviews</UnderlineTab>
            <UnderlineTab value="scorecards">Scorecards</UnderlineTab>
          </UnderlineTabsList>

          <div className="mt-4" />

          <TabsContent value="reviews" className="mt-0">
            <ReviewsTab />
          </TabsContent>
          <TabsContent value="scorecards" className="mt-0">
            <ScorecardsTab />
          </TabsContent>
        </Tabs>
      </PageSection>
    </Page>
  );
}
