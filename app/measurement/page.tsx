"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 헬퍼 함수: FormData에서 숫자 값 가져오기
const getNumber = (formData: FormData, key: string, isInt = false): number | undefined => {
  const value = formData.get(key);
  if (!value) return undefined;
  return isInt ? parseInt(value as string) : parseFloat(value as string);
};

// 헬퍼 함수: FormData에서 체크박스 값 가져오기
const getCheckbox = (formData: FormData, key: string): boolean => {
  return formData.get(key) === "on";
};

// 운동 섹션 타입 정의
interface ExerciseSection {
  title: string;
  prefix: string;
  kgField: string;
  repsField: string;
  options: { name: string; label: string }[];
}

// 운동 섹션 데이터
const exerciseSections: ExerciseSection[] = [
  {
    title: "[하체] 바벨 스쿼트",
    prefix: "squat",
    kgField: "squatKg",
    repsField: "squatReps",
    options: [
      { name: "squatDepth", label: "스쿼트 깊이 제한적 (병렬 이하 어려움)" },
      { name: "squatKneePain", label: "무릎 통증 발생" },
      { name: "squatLowerBack", label: "허리 부담 느낌" },
      { name: "squatBalance", label: "좌우 밸런스 불안정" },
    ],
  },
  {
    title: "[가슴] 벤치프레스",
    prefix: "bench",
    kgField: "benchKg",
    repsField: "benchReps",
    options: [
      { name: "benchShoulderDiscomfort", label: "어깨 불편감" },
      { name: "benchRangeLimit", label: "가동 범위 제한" },
      { name: "benchImbalance", label: "좌우 힘 차이 느낌" },
      { name: "benchScapula", label: "견갑 고정 어려움" },
    ],
  },
  {
    title: "[등] 랫풀다운",
    prefix: "lat",
    kgField: "latKg",
    repsField: "latReps",
    options: [
      { name: "latArms", label: "팔 위주로 당겨짐" },
      { name: "latLatsFeel", label: "광배 자극 인지 어려움" },
      { name: "latBounce", label: "반동 사용" },
      { name: "latScapula", label: "견갑 조절 어려움" },
    ],
  },
  {
    title: "[어깨] 숄더프레스",
    prefix: "shoulder",
    kgField: "shoulderKg",
    repsField: "shoulderReps",
    options: [
      { name: "shoulderOverextend", label: "허리 과신전 발생" },
      { name: "shoulderPain", label: "어깨 통증" },
      { name: "shoulderRange", label: "가동 범위 제한" },
      { name: "shoulderCore", label: "코어 불안정" },
    ],
  },
];

// 운동 섹션 컴포넌트
function ExerciseSection({ section }: { section: ExerciseSection }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700" htmlFor={section.kgField}>
            무게 (kg)
          </label>
          <input id={section.kgField} name={section.kgField} type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="무게" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700" htmlFor={section.repsField}>
            횟수 (reps)
          </label>
          <input id={section.repsField} name={section.repsField} type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-red-500 font-medium mb-2">선택사항</div>
        <div className="flex flex-col gap-1">
          {section.options.map((option) => (
            <label key={option.name} className="inline-flex items-center">
              <input type="checkbox" name={option.name} className="form-checkbox text-green-600" />
              <span className="ml-2">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MeasurementPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const { members } = useMemberStore();
  const addMeasurement = useMeasurementStore((state) => state.addMeasurement);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedMember) {
      alert("회원을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // 측정 데이터 구성
    const measurementData: any = {
      memberId: selectedMemberId,
      memberName: selectedMember.name,
      // 체성분
      muscle: getNumber(formData, "muscle"),
      bodyfat: getNumber(formData, "bodyfat"),
      beforeIntenseExercise: getCheckbox(formData, "beforeIntenseExercise"),
      waterIntakeDifferent: getCheckbox(formData, "waterIntakeDifferent"),
      recentWeightChange: getCheckbox(formData, "recentWeightChange"),
      // 운동별 데이터
      squatKg: getNumber(formData, "squatKg"),
      squatReps: getNumber(formData, "squatReps", true),
      squatDepth: getCheckbox(formData, "squatDepth"),
      squatKneePain: getCheckbox(formData, "squatKneePain"),
      squatLowerBack: getCheckbox(formData, "squatLowerBack"),
      squatBalance: getCheckbox(formData, "squatBalance"),
      benchKg: getNumber(formData, "benchKg"),
      benchReps: getNumber(formData, "benchReps", true),
      benchShoulderDiscomfort: getCheckbox(formData, "benchShoulderDiscomfort"),
      benchRangeLimit: getCheckbox(formData, "benchRangeLimit"),
      benchImbalance: getCheckbox(formData, "benchImbalance"),
      benchScapula: getCheckbox(formData, "benchScapula"),
      latKg: getNumber(formData, "latKg"),
      latReps: getNumber(formData, "latReps", true),
      latArms: getCheckbox(formData, "latArms"),
      latLatsFeel: getCheckbox(formData, "latLatsFeel"),
      latBounce: getCheckbox(formData, "latBounce"),
      latScapula: getCheckbox(formData, "latScapula"),
      shoulderKg: getNumber(formData, "shoulderKg"),
      shoulderReps: getNumber(formData, "shoulderReps", true),
      shoulderOverextend: getCheckbox(formData, "shoulderOverextend"),
      shoulderPain: getCheckbox(formData, "shoulderPain"),
      shoulderRange: getCheckbox(formData, "shoulderRange"),
      shoulderCore: getCheckbox(formData, "shoulderCore"),
      plankSec: getNumber(formData, "plankSec", true),
      plankSag: getCheckbox(formData, "plankSag"),
      plankShake: getCheckbox(formData, "plankShake"),
      plankBreath: getCheckbox(formData, "plankBreath"),
      plankCollapse: getCheckbox(formData, "plankCollapse"),
    };

    addMeasurement(measurementData);

    setShowSuccess(true);
    setIsSubmitting(false);
    e.currentTarget.reset();
    setSelectedMemberId("");

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📊</span>
          <h1 className="text-4xl font-bold text-gray-800">회원점수측정</h1>
        </div>
        <p className="text-gray-600 text-lg ml-12">회원의 체력 및 신체 측정 점수를 기록합니다</p>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="font-medium">측정 데이터가 성공적으로 저장되었습니다!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">📏</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">회원 점수 측정</h2>

          {/* 회원 선택 */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="memberSelect">
              측정할 회원 선택 <span className="text-red-500">*</span>
            </label>
            {members.length === 0 ? (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50 text-center">
                <p className="text-gray-600 mb-2">등록된 회원이 없습니다.</p>
                <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  회원정보등록 페이지로 이동
                </Link>
              </div>
            ) : (
              <>
                <select
                  id="memberSelect"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  required
                >
                  <option value="">회원을 선택하세요</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.gender === "male" ? "남" : "여"}, {member.age}세)
                    </option>
                  ))}
                </select>
                {selectedMember && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">선택된 회원:</span> {selectedMember.name} | 성별: {selectedMember.gender === "male" ? "남" : "여"} | 나이: {selectedMember.age}세 | 키:{" "}
                      {selectedMember.height}cm | 몸무게: {selectedMember.weight}kg
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* 체성분 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[체성분]</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="muscle">
                    골격근량 (kg)
                  </label>
                  <input id="muscle" name="muscle" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="골격근량" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="bodyfat">
                    체지방률 (%)
                  </label>
                  <input id="bodyfat" name="bodyfat" type="number" min="0" max="100" step="0.1" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="체지방률" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-red-500 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  {[
                    { name: "beforeIntenseExercise", label: "측정 전날 강도 높은 운동" },
                    { name: "waterIntakeDifferent", label: "수분 섭취 평소와 다름" },
                    { name: "recentWeightChange", label: "최근 체중 변동 있음" },
                  ].map((option) => (
                    <label key={option.name} className="inline-flex items-center">
                      <input type="checkbox" name={option.name} className="form-checkbox text-green-600" />
                      <span className="ml-2">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 운동 섹션들 */}
            {exerciseSections.map((section) => (
              <ExerciseSection key={section.prefix} section={section} />
            ))}

            {/* 코어 - 플랭크 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[코어] 플랭크</h3>
              <div className="grid grid-cols-2 gap-4 max-w-xs">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="plankSec">
                    플랭크 (초)
                  </label>
                  <input id="plankSec" name="plankSec" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="초" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-red-500 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  {[
                    { name: "plankSag", label: "허리 처짐 발생" },
                    { name: "plankShake", label: "어깨 떨림" },
                    { name: "plankBreath", label: "호흡 유지 어려움" },
                    { name: "plankCollapse", label: "30초 이후 자세 붕괴" },
                  ].map((option) => (
                    <label key={option.name} className="inline-flex items-center">
                      <input type="checkbox" name={option.name} className="form-checkbox text-green-600" />
                      <span className="ml-2">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedMemberId || isSubmitting || members.length === 0}
              className="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white text-lg font-semibold rounded-md py-2 hover:from-gray-600 hover:to-gray-800 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "측정 완료"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
