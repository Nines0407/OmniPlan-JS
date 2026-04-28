import { get, post, patch, del } from './client';
import type { Project, CreateProjectInput, UpdateProjectInput, ApiResponse, PatchBody } from '@omniplan/shared';

export function listProjects() {
  return get<ApiResponse<Project[]>>('/api/projects');
}

export function getProject(id: string) {
  return get<ApiResponse<Project>>(`/api/projects/${id}`);
}

export function createProject(data: CreateProjectInput) {
  return post<ApiResponse<Project>>('/api/projects', data);
}

export function updateProject(id: string, data: UpdateProjectInput, expectedVersion?: string) {
  const body: PatchBody = { changes: data };
  if (expectedVersion) body.expected_version = expectedVersion;
  return patch<ApiResponse<Project>>(`/api/projects/${id}`, body);
}

export function deleteProject(id: string) {
  return del<ApiResponse<null>>(`/api/projects/${id}`);
}
