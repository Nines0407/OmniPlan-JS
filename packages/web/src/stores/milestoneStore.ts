import { create } from 'zustand';
import type { Milestone } from '@omniplan/shared';
import { listMilestones, createMilestone, updateMilestone, deleteMilestone } from '../api/milestones';

interface MilestoneState {
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  loadMilestones: (projectId: string) => Promise<void>;
  addMilestone: (projectId: string, data: { name: string; due_date: string; description?: string }) => Promise<Milestone>;
  editMilestone: (id: string, data: Record<string, unknown>) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
}

export const useMilestoneStore = create<MilestoneState>((set) => ({
  milestones: [],
  loading: false,
  error: null,

  loadMilestones: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await listMilestones(projectId);
      set({ milestones: res.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  addMilestone: async (projectId, data) => {
    const res = await createMilestone(projectId, data as any);
    set((s) => ({ milestones: [...s.milestones, res.data] }));
    return res.data;
  },

  editMilestone: async (id, data) => {
    const res = await updateMilestone(id, data as any);
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === id ? res.data : m)),
    }));
  },

  removeMilestone: async (id) => {
    await deleteMilestone(id);
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
  },
}));
