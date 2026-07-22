export type ReviewType =
  | '90-Day'
  | 'Annual'
  | 'Client Satisfaction'
  | 'Corrective Coaching';

export type ReviewStatus =
  | 'Draft'
  | 'AI Generated'
  | 'In Review'
  | 'Completed'
  | 'Sent to Client'
  | 'Archived';

export type FinalRecommendation =
  | 'Continue Placement'
  | 'Continue with Coaching'
  | 'Replace VA'
  | 'Promote / Expand Role'
  | 'Compensation Review Recommended'
  | 'Client Follow-Up Needed';

export type RoleType =
  | 'Medical Receptionist VA'
  | 'Scheduler VA'
  | 'Insurance Verification VA'
  | 'Prior Authorization VA'
  | 'Referral Coordinator VA'
  | 'Billing VA'
  | 'Payment Posting VA'
  | 'Denials / AR Follow-Up VA'
  | 'Medical Scribe VA'
  | 'Administrative VA'
  | 'Marketing VA'
  | 'Social Media / Graphics VA'
  | 'Call Center VA'
  | 'Custom Role';

export const REVIEW_TYPES: ReviewType[] = [
  '90-Day',
  'Annual',
  'Client Satisfaction',
  'Corrective Coaching',
];

export const ROLE_TYPES: RoleType[] = [
  'Medical Receptionist VA',
  'Scheduler VA',
  'Insurance Verification VA',
  'Prior Authorization VA',
  'Referral Coordinator VA',
  'Billing VA',
  'Payment Posting VA',
  'Denials / AR Follow-Up VA',
  'Medical Scribe VA',
  'Administrative VA',
  'Marketing VA',
  'Social Media / Graphics VA',
  'Call Center VA',
  'Custom Role',
];

export const FINAL_RECOMMENDATIONS: FinalRecommendation[] = [
  'Continue Placement',
  'Continue with Coaching',
  'Replace VA',
  'Promote / Expand Role',
  'Compensation Review Recommended',
  'Client Follow-Up Needed',
];

export const REVIEW_STATUSES: ReviewStatus[] = [
  'Draft',
  'AI Generated',
  'In Review',
  'Completed',
  'Sent to Client',
  'Archived',
];

export const RATING_LABELS: Record<number, string> = {
  1: 'Unsatisfactory',
  2: 'Needs Improvement',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

export interface IPerformanceCategory {
  id: string;
  performanceReviewId: string;
  categoryName: string;
  categoryDescription: string;
  rating: number | null;
  managerComments: string;
  sortOrder: number;
}

export interface IPerformanceReview {
  id: string;
  candidateId: string;
  vaId: string;
  clientId: string;
  jobId: string;
  reviewType: ReviewType;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewStatus: ReviewStatus;
  generatedByUserId: string;
  reviewerUserId: string;
  overallRating: number | null;
  /** Phase 3 — store silently, no UI */
  clientSatisfactionScore: number | null;
  aiGeneratedSummary: string;
  finalManagerSummary: string;
  roleSummary: string;
  coreResponsibilities: string[];
  strengths: string;
  areasForImprovement: string;
  goalsNextPeriod: string[];
  finalRecommendation: FinalRecommendation | null;
  /** Phase 2 — store silently, no UI */
  managerRatingInputs: Record<
    string,
    { rating: number; managerComments: string }
  > | null;
  aiGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  // Populated by GET /:id
  categories?: IPerformanceCategory[];
  // Populated summaries from ATS for display
  candidateName?: string;
  clientName?: string;
  jobTitle?: string;
  reviewerName?: string;
}

export interface IGenerateReviewPayload {
  vaId?: string;
  clientId?: string;
  jobId?: string;
  candidateName?: string;
  clientName?: string;
  jobTitle?: string;
  reviewType: ReviewType;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  roleType: RoleType;
  jobDescription: string;
  clientExpectations: string;
  managerNotes?: string;
}

export interface IUpdateReviewPayload {
  roleSummary?: string;
  coreResponsibilities?: string[];
  strengths?: string;
  areasForImprovement?: string;
  goalsNextPeriod?: string[];
  finalRecommendation?: FinalRecommendation | null;
  overallRating?: number | null;
  finalManagerSummary?: string;
  reviewStatus?: ReviewStatus;
  /** Phase 2 — kept for silent storage */
  managerRatingInputs?: Record<
    string,
    { rating: number; managerComments: string }
  > | null;
}

export interface IUpdateCategoryPayload {
  rating?: number | null;
  managerComments?: string;
}
