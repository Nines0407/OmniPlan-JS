export interface Target {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TargetStats extends Target {
  total_tasks: number;
  done_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
}

export type CreateTargetInput = Pick<Target, 'name'> & {
  description?: string;
  cover_url?: string;
};

export type UpdateTargetInput = Partial<Pick<Target, 'name' | 'description' | 'cover_url' | 'sort_order'>>;
