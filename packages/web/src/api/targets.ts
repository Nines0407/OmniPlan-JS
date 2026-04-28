import { get, post, patch, del } from './client';
import type { Target, TargetStats, CreateTargetInput, UpdateTargetInput, ApiResponse, PatchBody } from '@omniplan/shared';

export function listTargets(projectId: string) {
  return get<ApiResponse<TargetStats[]>>(`/api/projects/${projectId}/targets`);
}

export function getTarget(id: string) {
  return get<ApiResponse<TargetStats>>(`/api/targets/${id}`);
}

export function createTarget(projectId: string, data: CreateTargetInput) {
  return post<ApiResponse<Target>>(`/api/projects/${projectId}/targets`, data);
}

export function updateTarget(id: string, data: UpdateTargetInput, expectedVersion?: string) {
  const body: PatchBody = { changes: data };
  if (expectedVersion) body.expected_version = expectedVersion;
  return patch<ApiResponse<Target>>(`/api/targets/${id}`, body);
}

export function deleteTarget(id: string) {
  return del<ApiResponse<null>>(`/api/targets/${id}`);
}
