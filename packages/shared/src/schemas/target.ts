import { z } from 'zod';

export const CreateTargetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  cover_url: z.string().url().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  duration: z.number().int().min(0).nullable().optional(),
});

export const UpdateTargetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  duration: z.number().int().min(0).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});
