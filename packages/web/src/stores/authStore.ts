import { create } from 'zustand';
import type { User } from '@omniplan/shared';
import { login as apiLogin, register as apiRegister, verifyToken } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  loadingAuth: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  register: (username: string, displayName: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  checkToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('omniplan_token'),
  isAuthenticated: false,
  loading: false,
  loadingAuth: true,
  error: null,

  checkToken: async () => {
    const token = localStorage.getItem('omniplan_token');
    if (!token) {
      set({ loadingAuth: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await verifyToken();
      set({ user: res.data.user, isAuthenticated: true, loadingAuth: false, token });
    } catch {
      localStorage.removeItem('omniplan_token');
      set({ user: null, token: null, isAuthenticated: false, loadingAuth: false });
    }
  },

  login: async (username: string) => {
    set({ loading: true, error: null });
    try {
      const res = await apiLogin(username);
      const { user, api_key } = res.data;
      localStorage.setItem('omniplan_token', api_key);
      set({ user, token: api_key, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  register: async (username: string, displayName: string) => {
    set({ loading: true, error: null });
    try {
      const res = await apiRegister(username, displayName);
      const { user, api_key } = res.data;
      localStorage.setItem('omniplan_token', api_key);
      set({ user, token: api_key, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('omniplan_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setToken: (token: string) => {
    localStorage.setItem('omniplan_token', token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:invalid', () => {
    useAuthStore.getState().logout();
  });
}
