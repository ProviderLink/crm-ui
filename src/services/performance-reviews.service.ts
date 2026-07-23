import api from '@/lib/api';
import type {
  IGenerateReviewPayload,
  IPerformanceReview,
  IUpdateReviewPayload,
  ReviewType,
} from '@/types/performance-review';

export interface IReviewFilters {
  vaId?: string;
  clientId?: string;
  jobId?: string;
  status?: string;
}

/**
 * Maps frontend display review types to backend enum values.
 * Backend schema uses snake_case; frontend uses human-readable labels.
 */
const REVIEW_TYPE_TO_BACKEND: Record<ReviewType, string> = {
  '30-Day': '30_day',
  '60-Day': '60_day',
  '90-Day': '90_day',
  Annual: 'annual',
  'Client Satisfaction': 'client_satisfaction',
  'Corrective Coaching': 'corrective_coaching',
};

const REVIEW_TYPE_FROM_BACKEND: Record<string, ReviewType> = {
  '30_day': '30-Day',
  '60_day': '60-Day',
  '90_day': '90-Day',
  annual: 'Annual',
  client_satisfaction: 'Client Satisfaction',
  corrective_coaching: 'Corrective Coaching',
};

/** Map a review from backend snake_case to frontend display format */
function mapReview(r: any): IPerformanceReview {
  if (r.reviewType && REVIEW_TYPE_FROM_BACKEND[r.reviewType]) {
    r.reviewType = REVIEW_TYPE_FROM_BACKEND[r.reviewType];
  }
  return r;
}

/** POST /crm/performance-reviews — AI-generate a new review */
export async function generateReview(
  payload: IGenerateReviewPayload
): Promise<IPerformanceReview> {
  const backendPayload = {
    ...payload,
    candidateId: payload.vaId,
    reviewType:
      REVIEW_TYPE_TO_BACKEND[payload.reviewType] ?? payload.reviewType,
  };
  const { data } = await api.post<{ data: IPerformanceReview }>(
    '/crm/performance-reviews',
    backendPayload
  );
  return mapReview(data.data);
}

export async function getReviews(
  filters?: IReviewFilters
): Promise<IPerformanceReview[]> {
  const params = filters
    ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ) as Record<string, string>
      ).toString()
    : '';
  const { data } = await api.get<{ data: IPerformanceReview[] }>(
    `/crm/performance-reviews${params ? `?${params}` : ''}`
  );
  return (data.data || []).map(mapReview);
}

export async function getReview(id: string): Promise<IPerformanceReview> {
  const { data } = await api.get<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}`
  );
  return mapReview(data.data);
}

export async function updateReview(
  id: string,
  payload: IUpdateReviewPayload
): Promise<IPerformanceReview> {
  const { data } = await api.patch<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}`,
    payload
  );
  return mapReview(data.data);
}

/**
 * Update a single category — fetches the full review, patches the category,
 * then sends the full categories array back (new backend updates whole array).
 */
export async function updateCategory(
  id: string,
  catId: string,
  payload: { rating?: number | null; managerComments?: string }
): Promise<void> {
  // Fetch current review to get full categories array
  const { data: review } = await api.get<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}`
  );
  const categories = (review.data.categories || []).map((c: any) =>
    c._id === catId ? { ...c, ...payload } : c
  );
  await api.patch(`/crm/performance-reviews/${id}`, { categories });
}

/** Regenerate a section via POST /:id/regenerate */
async function _regenerateSection(
  id: string,
  section: 'categories' | 'goals' | 'summary'
): Promise<IPerformanceReview> {
  const { data } = await api.post<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}/regenerate`,
    { section }
  );
  return mapReview(data.data);
}

export const regenerateCategories = (id: string) =>
  _regenerateSection(id, 'categories');
export const regenerateGoals = (id: string) => _regenerateSection(id, 'goals');
export const improveManagerSummary = (id: string) =>
  _regenerateSection(id, 'summary');

export async function completeReview(id: string): Promise<IPerformanceReview> {
  const { data } = await api.patch<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}/complete`
  );
  return mapReview(data.data);
}

/** DELETE /crm/performance-reviews/:id */
export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/crm/performance-reviews/${id}`);
}

/** GET /crm/performance-reviews/:id/export-pdf — download PDF */
export async function exportReviewPdf(
  id: string,
  filename = 'performance-review.pdf'
): Promise<void> {
  const response = await api.get(`/crm/performance-reviews/${id}/export-pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
