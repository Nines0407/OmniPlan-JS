export type MilestoneStatus = 'pending' | 'completed' | 'cancelled';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  due_date: string;
  status: MilestoneStatus;
  created_at: string;
  updated_at: string;
}

export type CreateMilestoneInput = Pick<Milestone, 'name' | 'due_date'> & {
  description?: string;
};

export type UpdateMilestoneInput = Partial<Pick<Milestone, 'name' | 'description' | 'due_date' | 'status'>>;
