"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signupApi } from "@/lib/api";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [gymName, setGymName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 유효성 검사
    if (!email || !password || !confirmPassword || !userName || !gymName) {
      setError("모든 필드를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsSubmitting(false);
      return;
    }

    // 비밀번호 길이 검사
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsSubmitting(false);
      return;
    }

    // 사용자 이름 길이 검사
    if (userName.length < 2) {
      setError("사용자 이름은 최소 2자 이상이어야 합니다.");
      setIsSubmitting(false);
      return;
    }

    // 헬스장 이름 길이 검사
    if (gymName.length < 2) {
      setError("헬스장 이름은 최소 2자 이상이어야 합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 백엔드 API 호출
      await signupApi({
        email,
        password,
        userName,
        gymName,
      });

      setIsSubmitting(false);
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      router.push("/login");
    } catch (error: any) {
      setIsSubmitting(false);
      // 에러 메시지 처리
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setError("이미 존재하는 이메일입니다.");
      } else if (error.response?.status === 400) {
        setError("입력한 정보를 확인해주세요.");
      } else {
        setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💪</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">회원가입</h1>
            <p className="text-gray-600">헬스장 회원관리 시스템에 가입하세요</p>
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="이메일을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="password">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="confirmPassword">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="userName">
                사용자 이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="사용자 이름을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="gymName">
                헬스장 이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="gymName"
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="헬스장 이름을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white text-lg font-semibold rounded-md py-3 hover:from-gray-600 hover:to-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>

            <div className="w-full border-t border-gray-200 my-4"></div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
