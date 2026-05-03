import type { TargetStats } from './target.js';

export interface ProjectStats {
  project_id: string;
  project_name: string;
  total_tasks: number;
  done_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  targets: TargetStats[];
}

export interface DaySummary {
  start_date: string;
  target_id: string;
  task_count: number;
  done_count: number;
  in_progress_count: number;
}

export interface TimelineData {
  tasks: Array<{
    id: string;
    name: string;
    target_id: string;
    target_name: string;
    project_id: string;
    project_name: string;
    project_color?: string;
    start_date: string;
    duration_days: number;
    status: string;
    progress: number;
    assignee_name?: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    project_id: string;
    due_date: string;
    status: string;
  }>;
  dependencies: Array<{
    task_id: string;
    dependency_id: string;
    dependency_type: string;
  }>;
}
