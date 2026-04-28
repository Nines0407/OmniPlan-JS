export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  color: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export type CreateProjectInput = Pick<Project, 'name'> & {
  description?: string;
  color?: string;
};

export type UpdateProjectInput = Partial<Pick<Project, 'name' | 'description' | 'color'>>;
