import { z } from 'zod';

import type { EodWorkStatus } from '@/types/eod-submission';

export const workEntrySchema = z.object({
  task: z.string().min(1, 'Task is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .min(0, 'Quantity must be 0 or more'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  timeSpent: z
    .number({ message: 'Time must be a number' })
    .min(0, 'Time must be 0 or more'),
});

export const schema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  shiftStart: z.string().min(1, 'Shift start is required'),
  shiftEnd: z.string().min(1, 'Shift end is required'),
  workEntries: z.array(workEntrySchema).min(1, 'Add at least one work entry'),
  pendingTasks: z.string().min(1, 'List pending tasks or write "None"'),
  blockers: z.string().min(1, 'Describe blockers or write "None"'),
  communicatedWithClient: z.enum(['yes', 'no', 'other'], {
    message: 'Please indicate whether you communicated with the client today',
  }),
  clientNote: z.string().optional(),
  notes: z.string().optional(),
});

export type FormData = z.infer<typeof schema>;

export const STATUS_LABELS: Record<EodWorkStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending Client Input',
};

export const DEFAULT_WORK_ENTRY = {
  task: '',
  description: '',
  quantity: 0,
  status: 'completed' as EodWorkStatus,
  timeSpent: 0,
};
