import { get } from './client';
import type { ProjectStats, TimelineData, ApiResponse } from '@omniplan/shared';

export function getStats(projectId?: string, targetId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set('project_id', projectId);
  if (targetId) params.set('target_id', targetId);
  return get<ApiResponse<ProjectStats>>(`/api/stats?${params.toString()}`);
}

export function getTimeline(projectId?: string) {
  const params = projectId ? `?project_id=${projectId}` : '';
  return get<ApiResponse<TimelineData>>(`/api/timeline${params}`);
}
