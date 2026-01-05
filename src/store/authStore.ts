import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  userName: string | null;
  login: (userName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userName: null,
      login: (userName: string) => set({ isLoggedIn: true, userName }),
      logout: () => set({ isLoggedIn: false, userName: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

