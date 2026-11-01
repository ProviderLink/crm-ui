import { z } from 'zod';

import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry';

/** The fields of a work entry that a VA fills in, when adding or editing. */
const workEntryFields = {
  entryDate: z.string().min(1, 'Date is required'),
  entryTime: z.string().min(1, 'Time is required'),
  taskCategory: z.enum(WORK_ENTRY_CATEGORIES, {
    error: 'Category is required',
  }),
  taskDescription: z.string().min(1, 'Description is required'),
  timeSpent: z
    .number({ error: 'Duration is required' })
    .int('Enter whole minutes')
    .min(1, 'Enter at least 1 minute')
    .max(480, 'Maximum is 480 minutes (8 hours) per entry'),
  status: z.enum(WORK_ENTRY_STATUSES),
  notes: z.string().optional(),
};

export const addWorkEntrySchema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  ...workEntryFields,
});

export const editWorkEntrySchema = z.object(workEntryFields);

export type AddWorkEntryForm = z.infer<typeof addWorkEntrySchema>;
export type EditWorkEntryForm = z.infer<typeof editWorkEntrySchema>;
