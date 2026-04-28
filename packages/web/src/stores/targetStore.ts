import { create } from 'zustand';
import type { Target, TargetStats } from '@omniplan/shared';
import { listTargets, createTarget, updateTarget, deleteTarget } from '../api/targets';

interface TargetState {
  targets: TargetStats[];
  loading: boolean;
  error: string | null;
  loadTargets: (projectId: string) => Promise<void>;
  addTarget: (projectId: string, data: { name: string; description?: string }) => Promise<Target>;
  editTarget: (id: string, data: Record<string, unknown>) => Promise<void>;
  removeTarget: (id: string) => Promise<void>;
}

export const useTargetStore = create<TargetState>((set) => ({
  targets: [],
  loading: false,
  error: null,

  loadTargets: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await listTargets(projectId);
      set({ targets: res.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  addTarget: async (projectId, data) => {
    const res = await createTarget(projectId, data);
    set((s) => ({ targets: [...s.targets, res.data as TargetStats] }));
    return res.data;
  },

  editTarget: async (id, data) => {
    const res = await updateTarget(id, data);
    set((s) => ({
      targets: s.targets.map((t) => (t.id === id ? { ...t, ...res.data } : t)),
    }));
  },

  removeTarget: async (id) => {
    await deleteTarget(id);
    set((s) => ({ targets: s.targets.filter((t) => t.id !== id) }));
  },
}));
