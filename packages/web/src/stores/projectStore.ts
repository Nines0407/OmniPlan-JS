import { create } from 'zustand';
import type { Project } from '@omniplan/shared';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../api/projects';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  addProject: (data: { name: string; description?: string; color?: string }) => Promise<Project>;
  editProject: (id: string, data: Record<string, unknown>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await listProjects();
      set({ projects: res.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  loadProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await getProject(id);
      set({ currentProject: res.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  addProject: async (data) => {
    const res = await createProject(data);
    const project = res.data;
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  editProject: async (id, data) => {
    const res = await updateProject(id, data);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? res.data : p)),
      currentProject: s.currentProject?.id === id ? res.data : s.currentProject,
    }));
  },

  removeProject: async (id) => {
    await deleteProject(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }));
  },
}));
