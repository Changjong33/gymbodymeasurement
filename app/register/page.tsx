"use client";

import { useState, FormEvent } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const addMember = useMemberStore((state) => state.addMember);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const gender = formData.get("gender") as "male" | "female";
    const age = parseInt(formData.get("age") as string);
    const height = parseFloat(formData.get("height") as string);
    const weight = parseFloat(formData.get("weight") as string);

    // 유효성 검사
    if (!name || !gender || !age || !height || !weight) {
      alert("모든 필드를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      alert("나이, 키, 몸무게는 0보다 큰 값을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 회원 정보 추가
    addMember({
      name,
      gender,
      age,
      height,
      weight,
    });

    // 성공 메시지 표시
    setShowSuccess(true);
    setIsSubmitting(false);

    // 폼 초기화
    e.currentTarget.reset();

    // 2초 후 성공 메시지 숨기기
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📝</span>
          <h1 className="text-4xl font-bold text-gray-800">회원정보등록</h1>
        </div>
        <p className="text-gray-600 text-lg ml-12">새로운 회원의 정보를 등록합니다</p>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="font-medium">회원 정보가 성공적으로 등록되었습니다!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">📋</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">회원정보 등록</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="name">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="gender">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-5">
                <label className="inline-flex items-center">
                  <input type="radio" name="gender" value="male" required className="form-radio text-blue-600" />
                  <span className="ml-2">남</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="gender" value="female" required className="form-radio text-blue-600" />
                  <span className="ml-2">여</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="age">
                나이 <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="1"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="나이를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="height">
                키(cm) <span className="text-red-500">*</span>
              </label>
              <input
                id="height"
                name="height"
                type="number"
                min="0.1"
                step="0.1"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="키를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="weight">
                몸무게(kg) <span className="text-red-500">*</span>
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                min="0.1"
                step="0.1"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="몸무게를 입력하세요"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white text-lg font-semibold rounded-md py-2 hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
