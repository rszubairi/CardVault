import { create } from 'zustand';
import { AuthProvider, UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;

  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setIsNewUser: (v: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setToken: (token) =>
    set({ token }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setIsNewUser: (isNewUser) =>
    set({ isNewUser }),

  signOut: () =>
    set({ user: null, token: null, isAuthenticated: false, isNewUser: false }),
}));
