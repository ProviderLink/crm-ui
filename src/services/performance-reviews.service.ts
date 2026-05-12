import api from '@/lib/api';
import type {
  IGenerateReviewPayload,
  IPerformanceReview,
  IUpdateCategoryPayload,
  IUpdateReviewPayload,
} from '@/types/performance-review';

export interface IReviewFilters {
  vaId?: string;
  clientId?: string;
  jobId?: string;
  status?: string;
}

export async function generateReview(
  payload: IGenerateReviewPayload
): Promise<IPerformanceReview> {
  const { data } = await api.post<{ data: IPerformanceReview }>(
    '/performance-reviews/generate',
    payload
  );
  return data.data;
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
    `/performance-reviews${params ? `?${params}` : ''}`
  );
  return data.data;
}

export async function getReview(id: string): Promise<IPerformanceReview> {
  const { data } = await api.get<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}`
  );
  return data.data;
}

export async function updateReview(
  id: string,
  payload: IUpdateReviewPayload
): Promise<IPerformanceReview> {
  const { data } = await api.patch<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}`,
    payload
  );
  return data.data;
}

export async function updateCategory(
  id: string,
  catId: string,
  payload: IUpdateCategoryPayload
): Promise<void> {
  await api.patch(`/performance-reviews/${id}/categories/${catId}`, payload);
}

export async function regenerateCategories(
  id: string
): Promise<IPerformanceReview> {
  const { data } = await api.post<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}/regenerate-categories`
  );
  return data.data;
}

export async function regenerateGoals(id: string): Promise<IPerformanceReview> {
  const { data } = await api.post<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}/regenerate-goals`
  );
  return data.data;
}

export async function improveManagerSummary(
  id: string
): Promise<IPerformanceReview> {
  const { data } = await api.post<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}/improve-manager-summary`
  );
  return data.data;
}

export async function completeReview(id: string): Promise<IPerformanceReview> {
  const { data } = await api.patch<{ data: IPerformanceReview }>(
    `/performance-reviews/${id}/complete`
  );
  return data.data;
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/performance-reviews/${id}`);
}

export async function exportReviewPdf(
  id: string,
  filename = 'performance-review.pdf'
): Promise<void> {
  const response = await api.get(`/performance-reviews/${id}/export-pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(
    new Blob([response.data as BlobPart], { type: 'application/pdf' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
