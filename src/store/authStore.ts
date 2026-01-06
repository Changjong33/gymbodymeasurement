import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  ownerName: string | null;
  email: string | null;
  token: string | null;
  login: (ownerName: string, email: string, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      ownerName: null,
      email: null,
      token: null,
      login: (ownerName: string, email: string, token?: string) => set({ isLoggedIn: true, ownerName, email, token: token || null }),
      logout: () => set({ isLoggedIn: false, ownerName: null, email: null, token: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
