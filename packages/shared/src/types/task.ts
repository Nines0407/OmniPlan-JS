export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  target_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  week_start: string | null;
  duration_weeks: number;
  assignee_id: string | null;
  progress: number;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  dependency_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export type CreateTaskInput = Pick<Task, 'name'> & {
  description?: string;
  priority?: TaskPriority;
  week_start?: string;
  duration_weeks?: number;
  assignee_id?: string;
  tags?: string[];
};

export type UpdateTaskInput = {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  week_start?: string | null;
  duration_weeks?: number;
  assignee_id?: string | null;
  progress?: number;
  tags?: string[];
};
