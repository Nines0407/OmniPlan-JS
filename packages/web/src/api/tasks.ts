import { get, post, patch, del } from './client';
import type { Task, TaskDependency, CreateTaskInput, UpdateTaskInput, ApiResponse, PatchBody } from '@omniplan/shared';

export function listTasks(targetId: string, query?: Record<string, string>) {
  const params = new URLSearchParams(query).toString();
  return get<ApiResponse<Task[]>>(`/api/targets/${targetId}/tasks${params ? `?${params}` : ''}`);
}

export function getTask(id: string) {
  return get<ApiResponse<Task & { dependencies: TaskDependency[] }>>(`/api/tasks/${id}`);
}

export function createTask(targetId: string, data: CreateTaskInput) {
  return post<ApiResponse<Task>>(`/api/targets/${targetId}/tasks`, data);
}

export function updateTask(id: string, data: UpdateTaskInput, expectedVersion?: string) {
  const body: PatchBody = { changes: data };
  if (expectedVersion) body.expected_version = expectedVersion;
  return patch<ApiResponse<Task>>(`/api/tasks/${id}`, body);
}

export function deleteTask(id: string) {
  return del<ApiResponse<null>>(`/api/tasks/${id}`);
}

export function addDependency(taskId: string, dependencyId: string, dependencyType?: string) {
  return post<ApiResponse<TaskDependency>>(`/api/tasks/${taskId}/dependencies`, {
    dependency_id: dependencyId,
    dependency_type: dependencyType || 'finish_to_start',
  });
}

export function removeDependency(taskId: string, depId: string) {
  return del<ApiResponse<null>>(`/api/tasks/${taskId}/dependencies/${depId}`);
}

export function bulkUpdateTasks(taskIds: string[], changes: Record<string, unknown>) {
  return post<ApiResponse<Task[]>>('/api/bulk/tasks', { task_ids: taskIds, changes });
}
