"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { path: "/", label: "홈", icon: "🏠" },
  { path: "/register", label: "회원정보등록", icon: "📝" },
  { path: "/measurement", label: "회원점수측정", icon: "📊" },
  { path: "/list", label: "회원정보목록", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 min-h-screen shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">메뉴</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-gradient-to-r from-gray-400 to-gray-600 text-white font-semibold shadow-md transform scale-[1.02]" : "text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
