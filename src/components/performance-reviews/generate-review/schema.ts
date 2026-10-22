import { z } from 'zod';

import {
  REVIEW_TYPES,
  ROLE_TYPES,
  type ReviewType,
  type RoleType,
} from '@/types/performance-review';

export const schema = z.object({
  clientId: z.string().min(1, 'Please select a client'),
  vaId: z.string().min(1, 'Please select a VA'),
  reviewType: z.enum(REVIEW_TYPES as [ReviewType, ...ReviewType[]]),
  reviewPeriodStart: z.string().min(1, 'Required'),
  reviewPeriodEnd: z.string().min(1, 'Required'),
  roleType: z.enum(ROLE_TYPES as [RoleType, ...RoleType[]]),
  jobDescription: z.string().min(10, 'Please enter a job description'),
  clientExpectations: z.string().min(1, 'Required'),
  managerNotes: z.string().optional(),
});

export type FormValues = z.infer<typeof schema>;
