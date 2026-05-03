import { z } from 'zod';

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  duration_days: z.number().int().min(1).max(365).optional(),
  assignee_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateTaskSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  duration_days: z.number().int().min(1).max(365).optional(),
  assignee_id: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateDependencySchema = z.object({
  dependency_id: z.string().min(1),
  dependency_type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']).optional(),
});

export const TaskQuerySchema = z.object({
  status: z.string().optional(),
  assignee_id: z.string().optional(),
  start_date: z.string().optional(),
});

export const BulkUpdateSchema = z.object({
  task_ids: z.array(z.string().min(1)).min(1),
  changes: z.object({
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
    progress: z.number().min(0).max(100).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  }),
});
