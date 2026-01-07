"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { calculateMeasurementsApi } from "@/lib/api";
import { generateEvaluationFromApiResponse, generateEvaluation, EvaluationResult } from "@/lib/evaluationUtils";
import { convertFormDataToMeasurement, convertMeasurementToApiRequest } from "@/lib/measurementUtils";
import { ExerciseType, BaseSection } from "@/types/exercise";
import { weightTrainingSections } from "./WeightTrainingSection";
import WeightTrainingSection from "./WeightTrainingSection";
import { bodyweightSections } from "./BodyweightSection";
import BodyweightSection from "./BodyweightSection";
import { flexibilitySections } from "./FlexibilitySection";
import FlexibilitySection from "./FlexibilitySection";
import MemberSelector from "@/components/MemberSelector";
import ExerciseTypeSelector from "@/components/ExerciseTypeSelector";
import EvaluationModal from "@/components/EvaluationModal";

export default function MeasurementPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const { members } = useMemberStore();
  const addMeasurement = useMeasurementStore((state) => state.addMeasurement);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedExerciseTypes, setSelectedExerciseTypes] = useState<ExerciseType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

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

  // 선택한 운동 타입에 맞는 운동 섹션 필터링
  const filteredExerciseSections = useMemo(() => {
    if (selectedExerciseTypes.length === 0) return [];

    const allSections: Array<{ section: BaseSection; category: ExerciseType; component: React.ComponentType<any> }> = [];

    if (selectedExerciseTypes.includes("weight")) {
      weightTrainingSections.forEach((section) => {
        allSections.push({ section, category: "weight", component: WeightTrainingSection });
      });
    }

    if (selectedExerciseTypes.includes("bodyweight")) {
      bodyweightSections.forEach((section) => {
        allSections.push({ section, category: "bodyweight", component: BodyweightSection });
      });
    }

    if (selectedExerciseTypes.includes("flexibility")) {
      flexibilitySections.forEach((section) => {
        allSections.push({ section, category: "flexibility", component: FlexibilitySection });
      });
    }

    return allSections;
  }, [selectedExerciseTypes]);

  // 다음 버튼 활성화 조건
  const canProceed = selectedMemberId && selectedExerciseTypes.length > 0;

  // 운동 타입 토글 함수
  const toggleExerciseType = (exerciseType: ExerciseType) => {
    setSelectedExerciseTypes((prev) => {
      if (prev.includes(exerciseType)) {
        // 이미 선택된 경우 제거
        return prev.filter((type) => type !== exerciseType);
      } else {
        // 선택되지 않은 경우 추가
        return [...prev, exerciseType];
      }
    });
  };

  const handleNext = () => {
    if (canProceed) {
      setShowMeasurementForm(true);
    }
  };

  const handleBack = () => {
    setShowMeasurementForm(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedMember) {
      alert("회원을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // 측정 데이터 구성
    const measurementData = convertFormDataToMeasurement(formData, selectedMemberId, selectedMember.name, selectedExerciseTypes);

    try {
      // API 호출을 위한 측정 데이터 변환
      const measurements = convertMeasurementToApiRequest(measurementData);

      // API 호출
      let apiResponse = null;
      if (measurements.length > 0) {
        // memberId를 숫자로 변환 (API가 숫자를 기대함)
        const memberIdNum = parseInt(selectedMemberId.replace(/\D/g, "")) || parseInt(selectedMemberId);
        apiResponse = await calculateMeasurementsApi({
          memberId: memberIdNum,
          measurements,
        });
      }

      // 로컬 스토어에 저장
      addMeasurement(measurementData);

      // 총평 생성 (API 응답이 있으면 API 기반, 없으면 기존 방식)
      const evaluation = apiResponse ? generateEvaluationFromApiResponse(selectedMember, apiResponse, measurementData) : generateEvaluation(selectedMember, measurementData);

      setEvaluationResult(evaluation);
      setIsSubmitting(false);
      setShowMeasurementForm(false);
      setShowEvaluation(true);
    } catch (error: any) {
      console.error("측정 계산 API 호출 실패:", error);
      // API 실패 시 기존 방식으로 총평 생성
      addMeasurement(measurementData);
      const evaluation = generateEvaluation(selectedMember, measurementData);
      setEvaluationResult(evaluation);
      setIsSubmitting(false);
      setShowMeasurementForm(false);
      setShowEvaluation(true);
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    setEvaluationResult(null);
    setShowSuccess(true);
    setSelectedMemberId("");
    setSelectedExerciseTypes([]);

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
          {!showMeasurementForm ? (
            <>
              {/* 회원 선택 섹션 */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">측정할 회원 선택</h2>
                <MemberSelector members={members} selectedMemberId={selectedMemberId} onSelectMember={setSelectedMemberId} />
              </div>

              {/* 운동 선택 섹션 */}
              {selectedMemberId && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">측정할 운동 선택 (복수 선택 가능)</h2>
                  <ExerciseTypeSelector selectedExerciseTypes={selectedExerciseTypes} onToggleExerciseType={toggleExerciseType} filteredExerciseSections={filteredExerciseSections} />
                </div>
              )}

              {/* 다음 버튼 */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full bg-gradient-to-r flex justify-center items-center from-green-400 to-green-600 text-white text-lg font-semibold rounded-md py-3 hover:from-green-500 hover:to-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:from-gray-300 disabled:hover:to-gray-300"
              >
                다음
              </button>
            </>
          ) : (
            <>
              {/* 측정 폼 */}
              <div className="mb-6">
                <button type="button" onClick={handleBack} className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2">
                  ← 뒤로가기
                </button>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">회원:</span> {selectedMember?.name} | <span className="font-semibold">운동:</span>{" "}
                    {selectedExerciseTypes.map((type) => (type === "flexibility" ? "유연성" : type === "bodyweight" ? "맨몸운동" : "웨이트 트레이닝")).join(", ")}
                  </p>
                </div>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* 선택한 운동 타입에 맞는 운동 섹션들 */}
                {filteredExerciseSections.length > 0 ? (
                  <>
                    <div className="mb-4 text-lg font-semibold text-gray-700">측정할 운동 ({filteredExerciseSections.length}개)</div>
                    {filteredExerciseSections.map(({ section, component: Component }, index) => (
                      <div key={`${section.category}-${section.prefix}-${index}`} className="border-b border-gray-200 pb-6">
                        <Component section={section} />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">선택한 운동 타입에 대한 측정 항목이 없습니다.</div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMemberId}
                  className="w-full bg-gradient-to-r from-gray-400 to-gray-600 text-white text-lg font-semibold rounded-md py-2 hover:from-gray-600 hover:to-gray-800 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "저장 중..." : "측정 완료"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* 총평 모달 */}
      {showEvaluation && evaluationResult && <EvaluationModal evaluationResult={evaluationResult} onClose={handleCloseEvaluation} />}
    </div>
  );
}
