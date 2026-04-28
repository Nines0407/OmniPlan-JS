import type { z } from 'zod';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface PatchBody {
  changes: Record<string, unknown>;
  expected_version?: string;
}
