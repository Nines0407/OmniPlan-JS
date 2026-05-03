import { get, post, patch, del } from './client';
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput, ApiResponse, PatchBody } from '@omniplan/shared';

export function listMilestones(projectId: string) {
  return get<ApiResponse<Milestone[]>>(`/api/projects/${projectId}/milestones`);
}

export function createMilestone(projectId: string, data: CreateMilestoneInput) {
  return post<ApiResponse<Milestone>>(`/api/projects/${projectId}/milestones`, data);
}

export function updateMilestone(id: string, data: UpdateMilestoneInput, expectedVersion?: string) {
  const body: PatchBody = { changes: data };
  if (expectedVersion) body.expected_version = expectedVersion;
  return patch<ApiResponse<Milestone>>(`/api/milestones/${id}`, body);
}

export function deleteMilestone(id: string) {
  return del<ApiResponse<null>>(`/api/milestones/${id}`);
}
