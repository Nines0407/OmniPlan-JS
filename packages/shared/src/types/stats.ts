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

export interface WeekSummary {
  week_start: string;
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
    week_start: string;
    duration_weeks: number;
    status: string;
    progress: number;
    assignee_name?: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    due_date: string;
    status: string;
  }>;
  dependencies: Array<{
    task_id: string;
    dependency_id: string;
    dependency_type: string;
  }>;
}
