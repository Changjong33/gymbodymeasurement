"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { createMemberApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const addMember = useMemberStore((state) => state.addMember);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [showMoreInjuries, setShowMoreInjuries] = useState(false);

  // 실제 인증 상태 가져오기 (개발 모드 우회 포함)
  const { isLoggedIn } = getEffectiveAuth();
  const devMode = isDevMode();

  // 로그인 체크 (개발 모드에서는 우회)
  useEffect(() => {
    if (!isLoggedIn && !devMode) {
      router.push("/login");
    }
  }, [isLoggedIn, devMode, router]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음 (개발 모드 제외)
  if (!isLoggedIn && !devMode) {
    return null;
  }

  const handleInjuryChange = (injury: string) => {
    setInjuries((prev) => {
      if (prev.includes(injury)) {
        return prev.filter((item) => item !== injury);
      } else {
        return [...prev, injury];
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const gender = formData.get("gender") as "male" | "female";
    const age = parseInt(formData.get("age") as string);
    const height = parseFloat(formData.get("height") as string);
    const weight = parseFloat(formData.get("weight") as string);

    // 유효성 검사
    if (!name || !gender || !age || !height || !weight) {
      setError("모든 필수 필드를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      setError("나이, 키, 몸무게는 0보다 큰 값을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 부상 부위를 notes로 변환 (선택사항)
      const notes = injuries.length > 0 ? injuries.join(", ") : undefined;

      // gender 변환: "male" -> "M", "female" -> "F"
      const genderCode = gender === "male" ? "M" : "F";

      // 백엔드 API 호출하여 DB에 저장
      await createMemberApi({
        gymId: 1,
        name,
        gender: genderCode,
        age: age.toString(),
        height,
        weight,
        notes,
      });

      // 로컬 스토어에도 추가 (기존 기능 유지)
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
      setInjuries([]);
      setShowMoreInjuries(false);

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error: any) {
      setIsSubmitting(false);
      // 에러 메시지 처리
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError("입력한 정보를 확인해주세요.");
      } else {
        setError("회원 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="text-xl">❌</span>
          <span className="font-medium">{error}</span>
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
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" name="gender" value="male" required className="form-radio text-blue-600" />
                  <span className="ml-2">남</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
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

            <div>
              <label className="block text-gray-700 font-medium mb-2">특이사항 (부상)</label>

              <div className="space-y-3">
                {/* 주요 부상 부위 */}
                <div className="flex flex-wrap gap-3">
                  {["무릎", "발목", "어깨", "허리", "손목", "목"].map((injury) => (
                    <label key={injury} className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox text-blue-600 rounded" />
                      <span className="ml-2 text-gray-700">{injury}</span>
                    </label>
                  ))}
                </div>

                {/* 더보기 버튼 */}
                <div className="transition-all duration-300 ease-in-out">
                  <button
                    type="button"
                    className="text-blue-600 text-sm font-medium focus:outline-none hover:underline transition-all duration-300"
                    onClick={() => setShowMoreInjuries((prev) => !prev)}
                  >
                    {showMoreInjuries ? "숨기기 ▲" : "+ 더보기 ▼"}
                  </button>
                </div>

                {/* 추가 부상 부위 */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMoreInjuries ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                    {[
                      "고관절",
                      "발가락",
                      "햄스트링",
                      "대퇴사두근",
                      "종아리",
                      "아킬레스건",
                      "골반",
                      "좌골신경통",
                      "회전근개",
                      "팔꿈치",
                      "이두",
                      "삼두",
                      "가슴",
                      "등",
                      "광배",
                      "승모",
                      "복부",
                      "옆구리",
                    ].map((injury) => (
                      <label key={injury} className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox text-blue-600 rounded" />
                        <span className="ml-2 text-gray-700">{injury}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white text-lg font-semibold rounded-md py-2 hover:from-gray-600 hover:to-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
