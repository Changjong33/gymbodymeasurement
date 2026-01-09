"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { calculateMeasurementsApi, CalculateMeasurementsResponse } from "@/lib/api";
import { generateEvaluationFromApiResponse, generateEvaluation, generateMockMeasurementsResponse, EvaluationResult } from "@/lib/evaluationUtils";
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
  const [apiResponseResults, setApiResponseResults] = useState<any[]>([]);
  const [apiResponseData, setApiResponseData] = useState<CalculateMeasurementsResponse | null>(null);
  const [formValid, setFormValid] = useState(false);

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

  // 버튼 내부(노란 목록)용: 전체 운동 섹션(선택 여부와 무관)
  const allExerciseSections = useMemo(() => {
    const all: Array<{ section: BaseSection }> = [];
    weightTrainingSections.forEach((section) => all.push({ section }));
    bodyweightSections.forEach((section) => all.push({ section }));
    flexibilitySections.forEach((section) => all.push({ section }));
    return all;
  }, []);

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

  // 카테고리별로 섹션 그룹화 (렌더링 시 상단에 카테고리 제목 표시용)
  const groupedExerciseSections = useMemo(() => {
    const groups: Record<ExerciseType, Array<{ section: BaseSection; component: React.ComponentType<any> }>> = {
      weight: [],
      bodyweight: [],
      flexibility: [],
    };
    filteredExerciseSections.forEach(({ section, category, component }) => {
      groups[category].push({ section, component });
    });
    return groups;
  }, [filteredExerciseSections]);

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
      setFormValid(false); // 새 폼 시작 시 검증 상태 초기화
    }
  };

  const handleBack = () => {
    setShowMeasurementForm(false);
    setFormValid(false); // 폼 닫을 때 검증 상태 초기화
  };

  // 폼 입력 값 변경 시 실시간 검증
  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    // 이벤트 버블링으로 모든 input 변경 감지
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
      const form = e.currentTarget;
      const formData = new FormData(form);
      setFormValid(validateRequiredFields(formData, false));
    }
  };

  // 선택된 운동 타입에 따른 필수 필드 검증
  const validateRequiredFields = (formData: FormData, showAlert = true): boolean => {
    // 웨이트 트레이닝 필수 필드
    const weightRequiredFields = [
      { field: "squatKg", label: "바벨 스쿼트" },
      { field: "benchKg", label: "벤치프레스" },
      { field: "shoulderKg", label: "숄더프레스" },
      { field: "barbellRowKg", label: "바벨 로우" },
      { field: "deadliftKg", label: "데드리프트" },
    ];

    // 맨몸운동 필수 필드
    const bodyweightRequiredFields = [
      { field: "pullupReps", label: "풀업" },
      { field: "situpReps", label: "윗몸일으키기" },
      { field: "pushupReps", label: "푸쉬업" },
      { field: "bodyweightSquatReps", label: "스쿼트" },
      { field: "burpeeReps", label: "버피" },
    ];

    // 유연성 필수 필드
    const flexibilityRequiredFields = [
      { field: "thoracicMobility", label: "흉추 가동성" },
      { field: "shoulderFlexibility", label: "어깨 유연성" },
      { field: "hamstring", label: "햄스트링" },
      { field: "hipMobility", label: "고관절" },
      { field: "ankleMobility", label: "발목 가동성" },
    ];

    const missingFields: string[] = [];

    // 웨이트 트레이닝 검증
    if (selectedExerciseTypes.includes("weight")) {
      weightRequiredFields.forEach(({ field, label }) => {
        const value = formData.get(field);
        if (!value || (typeof value === "string" && value.trim() === "")) {
          missingFields.push(label);
        }
      });
    }

    // 맨몸운동 검증
    if (selectedExerciseTypes.includes("bodyweight")) {
      bodyweightRequiredFields.forEach(({ field, label }) => {
        const value = formData.get(field);
        if (!value || (typeof value === "string" && value.trim() === "")) {
          missingFields.push(label);
        }
      });
    }

    // 유연성 검증
    if (selectedExerciseTypes.includes("flexibility")) {
      flexibilityRequiredFields.forEach(({ field, label }) => {
        const value = formData.get(field);
        if (!value || (typeof value === "string" && value.trim() === "")) {
          missingFields.push(label);
        }
      });
    }

    if (missingFields.length > 0) {
      if (showAlert) {
        alert(`다음 항목의 점수를 입력해주세요:\n${missingFields.join("\n")}`);
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedMember) {
      alert("회원을 선택해주세요.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    // 필수 필드 검증
    if (!validateRequiredFields(formData)) {
      return;
    }

    setIsSubmitting(true);

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
        try {
          apiResponse = await calculateMeasurementsApi({
            memberId: memberIdNum,
            measurements,
          });
        } catch (apiError: any) {
          // API 호출 실패 시 mock 데이터 생성
          console.warn("측정 계산 API 호출 실패, mock 데이터 사용:", apiError?.response?.status || apiError?.message);
          // member weight 정보를 measurementData에 추가
          const measurementDataWithWeight = { ...measurementData, memberWeight: selectedMember.weight };
          apiResponse = generateMockMeasurementsResponse(measurementDataWithWeight, selectedExerciseTypes);
        }
      } else {
        // measurements가 비어있으면 mock 데이터 생성
        const measurementDataWithWeight = { ...measurementData, memberWeight: selectedMember.weight };
        apiResponse = generateMockMeasurementsResponse(measurementDataWithWeight, selectedExerciseTypes);
      }

      // 로컬 스토어에 저장
      addMeasurement(measurementData);

      // 총평 생성 (API 응답이 있으면 API 기반, 없으면 기존 방식)
      const evaluation = apiResponse ? generateEvaluationFromApiResponse(selectedMember, apiResponse, measurementData) : generateEvaluation(selectedMember, measurementData);

      setEvaluationResult(evaluation);
      setApiResponseResults(apiResponse?.data?.results || []);
      setApiResponseData(apiResponse || null);
      setIsSubmitting(false);
      setShowMeasurementForm(false);
      setShowEvaluation(true);
    } catch (error: any) {
      console.error("측정 데이터 처리 중 오류:", error);
      // 예상치 못한 오류 발생 시에도 mock 데이터로 처리
      try {
        const measurementDataWithWeight = { ...measurementData, memberWeight: selectedMember.weight };
        const mockResponse = generateMockMeasurementsResponse(measurementDataWithWeight, selectedExerciseTypes);
        addMeasurement(measurementData);
        const evaluation = generateEvaluationFromApiResponse(selectedMember, mockResponse, measurementData);
        setEvaluationResult(evaluation);
        setApiResponseResults(mockResponse.data.results);
        setIsSubmitting(false);
        setShowMeasurementForm(false);
        setShowEvaluation(true);
      } catch (fallbackError) {
        // 최후의 수단: 기존 방식
        console.error("Mock 데이터 생성 실패, 기존 방식 사용:", fallbackError);
        addMeasurement(measurementData);
        const evaluation = generateEvaluation(selectedMember, measurementData);
        setEvaluationResult(evaluation);
        setApiResponseResults([]);
        setIsSubmitting(false);
        setShowMeasurementForm(false);
        setShowEvaluation(true);
      }
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    setEvaluationResult(null);
    setApiResponseResults([]);
    setApiResponseData(null);
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
                  <ExerciseTypeSelector selectedExerciseTypes={selectedExerciseTypes} onToggleExerciseType={toggleExerciseType} allExerciseSections={allExerciseSections} />
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
              {/* 측정 폼 헤더 */}
              <div className="mb-8">
                <button type="button" onClick={handleBack} className="text-blue-600 hover:text-blue-800 font-medium mb-6 flex items-center gap-2 transition-colors">
                  <span className="text-xl">←</span>
                  <span>뒤로가기</span>
                </button>

                {/* 회원 및 운동 정보 카드 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">측정 회원</div>
                        <div className="text-lg font-semibold text-gray-800">{selectedMember?.name}</div>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-blue-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏋️</span>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">선택된 운동</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {selectedExerciseTypes.map((type) => (type === "flexibility" ? "유연성" : type === "bodyweight" ? "맨몸운동" : "웨이트 트레이닝")).join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    총 <span className="font-semibold text-blue-700">{filteredExerciseSections.length}개</span>의 측정 항목을 입력해주세요
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} onChange={handleFormChange} onInput={handleFormChange}>
                {/* 선택한 운동 타입에 맞는 운동 섹션들 */}
                {filteredExerciseSections.length > 0 ? (
                  <>
                    {(["weight", "bodyweight", "flexibility"] as ExerciseType[]).map((cat) => {
                      const items = groupedExerciseSections[cat];
                      if (!items || items.length === 0) return null;
                      const title = cat === "weight" ? "웨이트 트레이닝" : cat === "bodyweight" ? "맨몸운동" : "유연성";
                      const emoji = cat === "weight" ? "🏋️" : cat === "bodyweight" ? "💪" : "🧘";
                      const bgColor =
                        cat === "weight"
                          ? "from-purple-50 to-pink-50 border-purple-200"
                          : cat === "bodyweight"
                          ? "from-orange-50 to-amber-50 border-orange-200"
                          : "from-green-50 to-emerald-50 border-green-200";
                      const textColor = cat === "weight" ? "text-purple-700" : cat === "bodyweight" ? "text-orange-700" : "text-green-700";

                      return (
                        <div key={cat} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                          <div className={`bg-gradient-to-r ${bgColor} rounded-lg p-4 mb-4`}>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-3xl">{emoji}</span>
                              <div>
                                <h3 className={`text-xl font-semibold ${textColor}`}>{title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{items.length}개의 측정 항목</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            {items.map(({ section, component: Component }, index) => (
                              <div key={`${section.category}-${section.prefix}-${index}`} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                <Component section={section} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-4xl mb-3 block">📝</span>
                    <p>선택한 운동 타입에 대한 측정 항목이 없습니다.</p>
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="sticky bottom-0 bg-white pt-6 pb-2 -mx-8 px-8 border-t border-gray-200 mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedMemberId || !formValid}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-lg py-4 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:from-gray-300 disabled:hover:to-gray-300 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>저장 중...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✅</span>
                        <span>측정 완료</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* 총평 모달 */}
      {showEvaluation && evaluationResult && selectedMember && (
        <EvaluationModal
          evaluationResult={evaluationResult}
          apiResults={apiResponseResults}
          apiResponse={apiResponseData || undefined}
          selectedExerciseTypes={selectedExerciseTypes}
          member={{
            name: selectedMember.name,
            age: selectedMember.age,
            gender: selectedMember.gender,
            height: selectedMember.height,
            weight: selectedMember.weight,
          }}
          onClose={handleCloseEvaluation}
        />
      )}
    </div>
  );
}
