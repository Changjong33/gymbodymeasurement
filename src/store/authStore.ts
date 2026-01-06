import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  ownerName: string | null;
  email: string | null;
  token: string | null;
  gymId: number | null;
  login: (ownerName: string, email: string, token?: string, gymId?: number) => void;
  logout: () => void;
  isDevMode: () => boolean;
  getEffectiveAuth: () => { isLoggedIn: boolean; ownerName: string | null; email: string | null; gymId: number | null };
}

// 개발 모드 체크 함수
const isDevMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_APP_ENV === "development";
};

// 개발용 가짜 유저 데이터
const devUser = {
  ownerName: "개발용 트레이너",
  email: "dev@test.com",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      ownerName: null,
      email: null,
      token: null,
      gymId: null,
      login: (ownerName: string, email: string, token?: string, gymId?: number) => 
        set({ isLoggedIn: true, ownerName, email, token: token || null, gymId: gymId || null }),
      logout: () => set({ isLoggedIn: false, ownerName: null, email: null, token: null, gymId: null }),
      isDevMode: () => isDevMode(),
      getEffectiveAuth: () => {
        const state = get();
        const dev = isDevMode();

        // 개발 모드일 때는 항상 로그인된 것으로 처리
        if (dev) {
          return {
            isLoggedIn: true,
            ownerName: state.ownerName || devUser.ownerName,
            email: state.email || devUser.email,
            gymId: state.gymId || 1, // 개발 모드에서는 기본값 1 사용
          };
        }

        // 프로덕션 모드일 때는 실제 로그인 상태 반환
        return {
          isLoggedIn: state.isLoggedIn,
          ownerName: state.ownerName,
          email: state.email,
          gymId: state.gymId,
        };
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
