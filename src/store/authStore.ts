import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  userName: string | null;
  email: string | null;
  token: string | null;
  login: (userName: string, email: string, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userName: null,
      email: null,
      token: null,
      login: (userName: string, email: string, token?: string) => set({ isLoggedIn: true, userName, email, token: token || null }),
      logout: () => set({ isLoggedIn: false, userName: null, email: null, token: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
