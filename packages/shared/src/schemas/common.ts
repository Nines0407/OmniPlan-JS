import { z } from 'zod';

export const PatchBodySchema = z.object({
  changes: z.record(z.unknown()),
  expected_version: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const ProjectIdParamSchema = z.object({
  pid: z.string().min(1),
});

export const TargetIdParamSchema = z.object({
  tid: z.string().min(1),
});
