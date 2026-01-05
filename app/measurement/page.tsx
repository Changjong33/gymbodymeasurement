"use client";

import { useState, FormEvent } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import Link from "next/link";

export default function MeasurementPage() {
  const { members } = useMemberStore();
  const addMeasurement = useMeasurementStore((state) => state.addMeasurement);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedMember) {
      alert("회원을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // 체성분
    const muscle = formData.get("muscle") ? parseFloat(formData.get("muscle") as string) : undefined;
    const bodyfat = formData.get("bodyfat") ? parseFloat(formData.get("bodyfat") as string) : undefined;

    // 하체 - 바벨 스쿼트
    const squatKg = formData.get("squatKg") ? parseFloat(formData.get("squatKg") as string) : undefined;
    const squatReps = formData.get("squatReps") ? parseInt(formData.get("squatReps") as string) : undefined;

    // 가슴 - 벤치프레스
    const benchKg = formData.get("benchKg") ? parseFloat(formData.get("benchKg") as string) : undefined;
    const benchReps = formData.get("benchReps") ? parseInt(formData.get("benchReps") as string) : undefined;

    // 등 - 랫풀다운
    const latKg = formData.get("latKg") ? parseFloat(formData.get("latKg") as string) : undefined;
    const latReps = formData.get("latReps") ? parseInt(formData.get("latReps") as string) : undefined;

    // 어깨 - 숄더프레스
    const shoulderKg = formData.get("shoulderKg") ? parseFloat(formData.get("shoulderKg") as string) : undefined;
    const shoulderReps = formData.get("shoulderReps") ? parseInt(formData.get("shoulderReps") as string) : undefined;

    // 코어 - 플랭크
    const plankSec = formData.get("plankSec") ? parseInt(formData.get("plankSec") as string) : undefined;

    // 측정 데이터 추가
    addMeasurement({
      memberId: selectedMemberId,
      memberName: selectedMember.name,
      muscle,
      bodyfat,
      beforeIntenseExercise: formData.get("beforeIntenseExercise") === "on",
      waterIntakeDifferent: formData.get("waterIntakeDifferent") === "on",
      recentWeightChange: formData.get("recentWeightChange") === "on",
      squatKg,
      squatReps,
      squatDepth: formData.get("squatDepth") === "on",
      squatKneePain: formData.get("squatKneePain") === "on",
      squatLowerBack: formData.get("squatLowerBack") === "on",
      squatBalance: formData.get("squatBalance") === "on",
      benchKg,
      benchReps,
      benchShoulderDiscomfort: formData.get("benchShoulderDiscomfort") === "on",
      benchRangeLimit: formData.get("benchRangeLimit") === "on",
      benchImbalance: formData.get("benchImbalance") === "on",
      benchScapula: formData.get("benchScapula") === "on",
      latKg,
      latReps,
      latArms: formData.get("latArms") === "on",
      latLatsFeel: formData.get("latLatsFeel") === "on",
      latBounce: formData.get("latBounce") === "on",
      latScapula: formData.get("latScapula") === "on",
      shoulderKg,
      shoulderReps,
      shoulderOverextend: formData.get("shoulderOverextend") === "on",
      shoulderPain: formData.get("shoulderPain") === "on",
      shoulderRange: formData.get("shoulderRange") === "on",
      shoulderCore: formData.get("shoulderCore") === "on",
      plankSec,
      plankSag: formData.get("plankSag") === "on",
      plankShake: formData.get("plankShake") === "on",
      plankBreath: formData.get("plankBreath") === "on",
      plankCollapse: formData.get("plankCollapse") === "on",
    });

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
                  <input id="muscle" name="muscle" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="근육량" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="bodyfat">
                    체지방률 (%)
                  </label>
                  <input id="bodyfat" name="bodyfat" type="number" min="0" max="100" step="0.1" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="체지방률" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="beforeIntenseExercise" className="form-checkbox text-green-600" />
                    <span className="ml-2">측정 전날 강도 높은 운동</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="waterIntakeDifferent" className="form-checkbox text-green-600" />
                    <span className="ml-2">수분 섭취 평소와 다름</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="recentWeightChange" className="form-checkbox text-green-600" />
                    <span className="ml-2">최근 체중 변동 있음</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 하체 - 바벨 스쿼트 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[하체] 바벨 스쿼트</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="squatKg">
                    무게 (kg)
                  </label>
                  <input id="squatKg" name="squatKg" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="무게" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="squatReps">
                    횟수 (reps)
                  </label>
                  <input id="squatReps" name="squatReps" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="squatDepth" className="form-checkbox text-green-600" />
                    <span className="ml-2">스쿼트 깊이 제한적 (병렬 이하 어려움)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="squatKneePain" className="form-checkbox text-green-600" />
                    <span className="ml-2">무릎 통증 발생</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="squatLowerBack" className="form-checkbox text-green-600" />
                    <span className="ml-2">허리 부담 느낌</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="squatBalance" className="form-checkbox text-green-600" />
                    <span className="ml-2">좌우 밸런스 불안정</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 가슴 - 벤치프레스 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[가슴] 벤치프레스</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="benchKg">
                    무게 (kg)
                  </label>
                  <input id="benchKg" name="benchKg" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="무게" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="benchReps">
                    횟수 (reps)
                  </label>
                  <input id="benchReps" name="benchReps" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="benchShoulderDiscomfort" className="form-checkbox text-green-600" />
                    <span className="ml-2">어깨 불편감</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="benchRangeLimit" className="form-checkbox text-green-600" />
                    <span className="ml-2">가동 범위 제한</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="benchImbalance" className="form-checkbox text-green-600" />
                    <span className="ml-2">좌우 힘 차이 느낌</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="benchScapula" className="form-checkbox text-green-600" />
                    <span className="ml-2">견갑 고정 어려움</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 등 - 랫풀다운 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[등] 랫풀다운</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="latKg">
                    무게 (kg)
                  </label>
                  <input id="latKg" name="latKg" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="무게" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="latReps">
                    횟수 (reps)
                  </label>
                  <input id="latReps" name="latReps" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="latArms" className="form-checkbox text-green-600" />
                    <span className="ml-2">팔 위주로 당겨짐</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="latLatsFeel" className="form-checkbox text-green-600" />
                    <span className="ml-2">광배 자극 인지 어려움</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="latBounce" className="form-checkbox text-green-600" />
                    <span className="ml-2">반동 사용</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="latScapula" className="form-checkbox text-green-600" />
                    <span className="ml-2">견갑 조절 어려움</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 어깨 - 숄더프레스 */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">[어깨] 숄더프레스</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="shoulderKg">
                    무게 (kg)
                  </label>
                  <input id="shoulderKg" name="shoulderKg" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="무게" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700" htmlFor="shoulderReps">
                    횟수 (reps)
                  </label>
                  <input id="shoulderReps" name="shoulderReps" type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="shoulderOverextend" className="form-checkbox text-green-600" />
                    <span className="ml-2">허리 과신전 발생</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="shoulderPain" className="form-checkbox text-green-600" />
                    <span className="ml-2">어깨 통증</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="shoulderRange" className="form-checkbox text-green-600" />
                    <span className="ml-2">가동 범위 제한</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="shoulderCore" className="form-checkbox text-green-600" />
                    <span className="ml-2">코어 불안정</span>
                  </label>
                </div>
              </div>
            </div>

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
                <div className="text-gray-600 font-medium mb-2">선택사항</div>
                <div className="flex flex-col gap-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="plankSag" className="form-checkbox text-green-600" />
                    <span className="ml-2">허리 처짐 발생</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="plankShake" className="form-checkbox text-green-600" />
                    <span className="ml-2">어깨 떨림</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="plankBreath" className="form-checkbox text-green-600" />
                    <span className="ml-2">호흡 유지 어려움</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" name="plankCollapse" className="form-checkbox text-green-600" />
                    <span className="ml-2">30초 이후 자세 붕괴</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedMemberId || isSubmitting || members.length === 0}
              className="w-full bg-green-500 text-white text-lg font-semibold rounded-md py-2 hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "측정 완료"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
