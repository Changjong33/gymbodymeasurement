import type { Metadata } from "next";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "헬스장 회원관리 시스템",
  description: "헬스장 회원관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex min-h-[calc(100vh-80px)]">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
