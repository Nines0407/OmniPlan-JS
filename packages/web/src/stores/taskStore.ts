import { create } from 'zustand';
import type { Task } from '@omniplan/shared';
import { listTasks, createTask, updateTask, deleteTask } from '../api/tasks';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: { status?: string; assignee_id?: string; start_date?: string };
  loadTasks: (targetId: string, query?: Record<string, string>) => Promise<void>;
  addTask: (targetId: string, data: Record<string, unknown>) => Promise<Task>;
  editTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: {},

  loadTasks: async (targetId: string, query?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const res = await listTasks(targetId, query);
      set({ tasks: res.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  addTask: async (targetId, data) => {
    const res = await createTask(targetId, data as any);
    set((s) => ({ tasks: [...s.tasks, res.data] }));
    return res.data;
  },

  editTask: async (id, data) => {
    const res = await updateTask(id, data as any);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? res.data : t)),
    }));
  },

  removeTask: async (id) => {
    await deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  setFilters: (filters) => {
    set((s) => ({ filters: { ...s.filters, ...filters } }));
  },
}));
