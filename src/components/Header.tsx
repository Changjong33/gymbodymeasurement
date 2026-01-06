"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const router = useRouter();
  const { isLoggedIn, userName, logout } = useAuthStore();

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <header className="w-full bg-gradient-to-r from-gray-400 to-gray-600 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">💪</span>
          </div>
          <h1 className="text-xl font-bold text-white">헬스장 회원관리 시스템</h1>
        </div>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{userName?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-white font-medium">{userName}님</span>
            </div>
            <button onClick={logout} className="px-5 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold shadow-md hover:shadow-lg">
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={handleLoginClick} className="px-6 py-2.5 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold shadow-md hover:shadow-lg">
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
