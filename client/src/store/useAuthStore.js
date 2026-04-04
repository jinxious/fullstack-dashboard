import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('mf_user') || 'null'),
  token: localStorage.getItem('mf_token') || null,
  isAuthenticated: !!localStorage.getItem('mf_token'),
  isLoading: false,
  error: null,

  signup: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/api/auth/signup', { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('mf_token', token);
      localStorage.setItem('mf_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('mf_token', token);
      localStorage.setItem('mf_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('mf_token');
    localStorage.removeItem('mf_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('mf_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('mf_token');
      localStorage.removeItem('mf_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null })
}));
