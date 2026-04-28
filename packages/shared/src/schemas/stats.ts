import { z } from 'zod';

export const StatsQuerySchema = z.object({
  project_id: z.string().optional(),
  target_id: z.string().optional(),
});

export const TimelineQuerySchema = z.object({
  project_id: z.string().min(1),
});
