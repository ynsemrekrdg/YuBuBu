import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse, StudentProfile, TokenResponse } from '../types';
import { authService } from '../services/auth.service';
import api from '../services/api';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  studentProfile: StudentProfile | null;
  isLoading: boolean;

  setAuth: (tokenRes: TokenResponse) => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchStudentProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      studentProfile: null,
      isLoading: false,

      setAuth: async (tokenRes: TokenResponse) => {
        set({ token: tokenRes.access_token, isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isLoading: false });
          // If student, try to fetch profile
          if (user.role === 'student') {
            try {
              const res = await api.get(`/api/students/by-user/${user.id}`);
              set({ studentProfile: res.data });
            } catch {
              // Profile might not exist yet - fetch from all student profiles
              try {
                // Try alternative: query profile by iterating (simple fallback)
                const profileRes = await api.get('/api/auth/me');
                if (profileRes.data) {
                  // We'll fetch the profile when needed
                }
              } catch {
                // No profile yet
              }
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      fetchUser: async () => {
        try {
          const user = await authService.getMe();
          set({ user });
        } catch {
          get().logout();
        }
      },

      fetchStudentProfile: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const res = await api.get(`/api/students/by-user/${user.id}`);
          set({ studentProfile: res.data });
        } catch {
          // Profile may not be set up yet
        }
      },

      logout: () => {
        set({ token: null, user: null, studentProfile: null });
      },
    }),
    {
      name: 'yububu-auth',
      partialize: (state) => ({ token: state.token, user: state.user, studentProfile: state.studentProfile }),
    },
  ),
);
