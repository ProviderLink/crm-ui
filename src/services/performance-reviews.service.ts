import api from '@/lib/api';
import type {
  IGenerateReviewPayload,
  IPerformanceReview,
  IUpdateReviewPayload,
  ReviewStatus,
  ReviewType,
} from '@/types/performance-review';

export interface IReviewFilters {
  candidateId?: string;
  clientId?: string;
  status?: string;
}

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

const STATUS_FROM_BACKEND: Record<string, ReviewStatus> = {
  draft: 'Draft',
  ai_generated: 'AI Generated',
  in_review: 'In Review',
  completed: 'Completed',
  sent_to_client: 'Sent to Client',
  archived: 'Archived',
};

const STATUS_TO_BACKEND: Record<ReviewStatus, string> = {
  Draft: 'draft',
  'AI Generated': 'ai_generated',
  'In Review': 'in_review',
  Completed: 'completed',
  'Sent to Client': 'sent_to_client',
  Archived: 'archived',
};

/** Normalize a backend review document to frontend IPerformanceReview shape */
function mapReview(r: any): IPerformanceReview {
  const aiGen = r.aiGenerated ?? {};
  return {
    ...r,
    id: r._id ?? r.id,
    vaId: r.candidateId,
    reviewType: (REVIEW_TYPE_FROM_BACKEND[r.reviewType] ??
      r.reviewType) as ReviewType,
    reviewStatus: (STATUS_FROM_BACKEND[r.status] ??
      r.reviewStatus ??
      r.status) as ReviewStatus,
    // Flatten aiGenerated fields to top level
    roleSummary: aiGen.roleSummary ?? '',
    coreResponsibilities: Array.isArray(aiGen.coreResponsibilities)
      ? aiGen.coreResponsibilities
      : aiGen.coreResponsibilities
        ? [aiGen.coreResponsibilities]
        : [],
    strengths: aiGen.strengths ?? '',
    areasForImprovement: aiGen.areasForImprovement ?? '',
    goalsNextPeriod: aiGen.goals ?? [],
    finalManagerSummary: r.finalManagerSummary ?? '',
    // Normalize category IDs so cat.id works in the editor
    categories: (r.categories ?? []).map((c: any) => ({
      ...c,
      id: c._id ?? c.id,
    })),
    reviewPeriodStart: r.reviewPeriodStart
      ? String(r.reviewPeriodStart).slice(0, 10)
      : '',
    reviewPeriodEnd: r.reviewPeriodEnd
      ? String(r.reviewPeriodEnd).slice(0, 10)
      : '',
  };
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
  const backendPayload: Record<string, unknown> = {};

  // Wrap text content fields into aiGenerated
  const aiGenFields: Record<string, unknown> = {};
  if (payload.roleSummary !== undefined)
    aiGenFields.roleSummary = payload.roleSummary;
  if (payload.coreResponsibilities !== undefined)
    aiGenFields.coreResponsibilities = payload.coreResponsibilities;
  if (payload.strengths !== undefined)
    aiGenFields.strengths = payload.strengths;
  if (payload.areasForImprovement !== undefined)
    aiGenFields.areasForImprovement = payload.areasForImprovement;
  if (payload.goalsNextPeriod !== undefined)
    aiGenFields.goals = payload.goalsNextPeriod;
  if (Object.keys(aiGenFields).length > 0)
    backendPayload.aiGenerated = aiGenFields;

  if (payload.overallRating !== undefined)
    backendPayload.overallRating = payload.overallRating;
  if (payload.finalRecommendation !== undefined)
    backendPayload.finalRecommendation = payload.finalRecommendation;
  if (payload.finalManagerSummary !== undefined)
    backendPayload.finalManagerSummary = payload.finalManagerSummary;
  if (payload.managerRatingInputs !== undefined)
    backendPayload.managerRatingInputs = payload.managerRatingInputs;

  // Map frontend ReviewStatus to backend status — skip 'Completed' (use /complete endpoint)
  if (
    payload.reviewStatus !== undefined &&
    payload.reviewStatus !== 'Completed'
  ) {
    backendPayload.status = STATUS_TO_BACKEND[payload.reviewStatus];
  }

  // Include categories if provided (each must have _id)
  if (payload.categories !== undefined) {
    backendPayload.categories = payload.categories.map((c: any) => ({
      ...c,
      _id: c._id ?? c.id,
    }));
  }

  const { data } = await api.patch<{ data: IPerformanceReview }>(
    `/crm/performance-reviews/${id}`,
    backendPayload
  );
  return mapReview(data.data);
}

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
