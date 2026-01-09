"use client";

import { useState, FormEvent, useEffect, useMemo, useRef } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { calculateMeasurementsApi, MeasurementResult, CalculateMeasurementsResponse } from "@/lib/api";
import { convertFormDataToMeasurement, convertMeasurementToApiRequest, convertFlexibilityToChartData } from "@/lib/measurementUtils";
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
import { saveMeasurement } from "@/lib/measurementStorage";
import { SavedMeasurement } from "@/types/measurement";

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
  const [apiResponseResults, setApiResponseResults] = useState<MeasurementResult[]>([]);
  const [formValid, setFormValid] = useState(false);
  const [currentMeasurementData, setCurrentMeasurementData] = useState<any>(null);
  const [missingCategoryIds, setMissingCategoryIds] = useState<Set<number>>(new Set());

  // categoryId 기준 input ref 매핑
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  // 폼 입력 값 변경 시 실시간 검증 및 강조 해제
  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    // 이벤트 버블링으로 모든 input 변경 감지
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
      const form = e.currentTarget;
      const formData = new FormData(form);
      setFormValid(validateRequiredFields(formData, false));

      // 입력된 필드의 categoryId 찾아서 강조 해제
      const inputName = (target as HTMLInputElement).name;
      const categoryInfo = REQUIRED_CATEGORIES.find((cat) => cat.fieldName === inputName);

      if (categoryInfo && missingCategoryIds.has(categoryInfo.categoryId)) {
        // 값이 입력되었는지 확인
        const value = formData.get(inputName);
        let hasValue = false;

        if (categoryInfo.categoryId >= 11 && categoryInfo.categoryId <= 15) {
          // 유연성은 radio 버튼
          hasValue = !!value && typeof value === "string" && value.trim() !== "";
        } else {
          // 숫자 필드
          const numValue = value ? parseFloat(value as string) : 0;
          hasValue = !!value && typeof value === "string" && value.trim() !== "" && numValue !== 0 && !isNaN(numValue);
        }

        if (hasValue) {
          // 강조 해제
          setMissingCategoryIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(categoryInfo.categoryId);
            return newSet;
          });
        }
      }
    }
  };

  // 필수 측정 항목 목록 (categoryId 기준)
  const REQUIRED_CATEGORIES = useMemo(() => {
    const required: Array<{ categoryId: number; name: string; fieldName: string }> = [];

    if (selectedExerciseTypes.includes("weight")) {
      required.push(
        { categoryId: 4, name: "바벨 스쿼트", fieldName: "squatKg" },
        { categoryId: 1, name: "벤치프레스", fieldName: "benchKg" },
        { categoryId: 3, name: "숄더프레스", fieldName: "shoulderKg" },
        { categoryId: 6, name: "바벨 로우", fieldName: "barbellRowKg" },
        { categoryId: 7, name: "데드리프트", fieldName: "deadliftKg" }
      );
    }

    if (selectedExerciseTypes.includes("bodyweight")) {
      required.push(
        { categoryId: 2, name: "풀업", fieldName: "pullupReps" },
        { categoryId: 5, name: "윗몸일으키기", fieldName: "situpReps" },
        { categoryId: 8, name: "푸쉬업", fieldName: "pushupReps" },
        { categoryId: 9, name: "스쿼트", fieldName: "bodyweightSquatReps" },
        { categoryId: 10, name: "버피", fieldName: "burpeeReps" }
      );
    }

    if (selectedExerciseTypes.includes("flexibility")) {
      required.push(
        { categoryId: 11, name: "흉추 가동성", fieldName: "thoracicMobility" },
        { categoryId: 12, name: "어깨 유연성", fieldName: "shoulderFlexibility" },
        { categoryId: 13, name: "햄스트링", fieldName: "hamstring" },
        { categoryId: 14, name: "고관절", fieldName: "hipMobility" },
        { categoryId: 15, name: "발목 가동성", fieldName: "ankleMobility" }
      );
    }

    return required;
  }, [selectedExerciseTypes]);

  // 선택된 운동 타입에 따른 필수 필드 검증 (기존 함수 유지 - 실시간 검증용)
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

  // categoryId 기준으로 누락된 항목 찾기
  const findMissingCategoryIds = (formData: FormData): number[] => {
    const missing: number[] = [];

    REQUIRED_CATEGORIES.forEach(({ categoryId, fieldName }) => {
      const value = formData.get(fieldName);

      // 유연성은 radio 버튼이므로 문자열 체크
      if (categoryId >= 11 && categoryId <= 15) {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          missing.push(categoryId);
        }
      } else {
        // 숫자 필드는 null, undefined, 0, 빈 문자열 체크
        const numValue = value ? parseFloat(value as string) : 0;
        if (!value || (typeof value === "string" && value.trim() === "") || numValue === 0 || isNaN(numValue)) {
          missing.push(categoryId);
        }
      }
    });

    return missing;
  };

  // 첫 번째 누락된 항목으로 스크롤 및 포커스
  const focusFirstMissingInput = (missingCategoryIds: number[]) => {
    if (missingCategoryIds.length === 0) return false;

    const firstMissingCategoryId = missingCategoryIds[0];
    const inputRef = inputRefs.current[firstMissingCategoryId];

    if (inputRef) {
      // 스크롤
      inputRef.scrollIntoView({ behavior: "smooth", block: "center" });

      // 포커스 (약간의 지연을 두어 스크롤 후 포커스)
      setTimeout(() => {
        inputRef.focus();
      }, 300);

      return true;
    }

    return false;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedMember) {
      alert("회원을 선택해주세요.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    // categoryId 기준으로 누락된 항목 찾기
    const missing = findMissingCategoryIds(formData);

    if (missing.length > 0) {
      // 누락된 항목이 있으면 시각적 강조를 위한 state 업데이트
      setMissingCategoryIds(new Set(missing));

      // 첫 번째 누락된 항목으로 스크롤 및 포커스
      focusFirstMissingInput(missing);

      // API 호출하지 않음
      return;
    }

    // 모든 필수 항목이 입력되었으면 강조 해제
    setMissingCategoryIds(new Set());

    setIsSubmitting(true);

    // 측정 데이터 구성
    const measurementData = convertFormDataToMeasurement(formData, selectedMemberId, selectedMember.name, selectedExerciseTypes);

    try {
      // API 호출을 위한 측정 데이터 변환 (유연성 제외, 선택한 운동 타입만 포함)
      const measurements = convertMeasurementToApiRequest(measurementData, selectedExerciseTypes);

      // API 호출
      let apiResponse: CalculateMeasurementsResponse | null = null;
      if (measurements.length > 0) {
        // memberId를 숫자로 변환 (API가 숫자를 기대함)
        // selectedMemberId는 백엔드에서 받은 실제 DB의 memberId (숫자 문자열)
        let memberIdNum: number;
        if (selectedMemberId.startsWith("member_")) {
          // 로컬 스토어의 임의 ID인 경우 숫자 추출 시도
          memberIdNum = parseInt(selectedMemberId.replace(/\D/g, "")) || 0;
        } else {
          // 백엔드에서 받은 숫자 ID인 경우 직접 변환
          memberIdNum = parseInt(selectedMemberId, 10);
        }

        if (!memberIdNum || isNaN(memberIdNum)) {
          console.error("유효하지 않은 memberId:", selectedMemberId);
          alert("회원 ID가 유효하지 않습니다. 다시 선택해주세요.");
          setIsSubmitting(false);
          return;
        }

        try {
          console.log("API 호출 - memberId:", memberIdNum, "measurements:", measurements);
          apiResponse = await calculateMeasurementsApi({
            memberId: memberIdNum,
            measurements,
          });
          console.log("API 응답 성공:", apiResponse);
        } catch (apiError: any) {
          // API 호출 실패 시 상세 에러 로그
          console.error("측정 계산 API 호출 실패:", {
            status: apiError?.response?.status,
            statusText: apiError?.response?.statusText,
            data: apiError?.response?.data,
            message: apiError?.message,
            url: apiError?.config?.url,
            method: apiError?.config?.method,
          });
          // API 응답이 없어도 결과를 표시할 수 있도록 빈 배열로 설정
          apiResponse = null;
        }
      }

      // 로컬 스토어에 저장
      addMeasurement(measurementData);

      // 모달에 표시하기 위해 measurementData 저장
      setCurrentMeasurementData(measurementData);

      // 백엔드 응답 결과 저장 (API 응답이 있으면 사용, 없으면 빈 배열)
      const apiResults = apiResponse?.data?.results || [];

      // 유연성 데이터를 차트용 형식으로 변환 (로컬에서만 사용, 백엔드로 전송하지 않음)
      const flexibilityResults: MeasurementResult[] = selectedExerciseTypes.includes("flexibility")
        ? convertFlexibilityToChartData(measurementData).map((flex) => ({
            categoryId: flex.categoryId,
            exerciseName: flex.exerciseName,
            value: flex.value,
            unit: flex.unit,
            score: flex.score,
            adjustedLevels: {
              beginner: 1,
              novice: 2,
              intermediate: 3,
              advanced: 4,
              elite: 5,
            },
          }))
        : [];

      // API 결과와 유연성 결과 합치기
      const allResults = [...apiResults, ...flexibilityResults];
      setApiResponseResults(allResults);
      setIsSubmitting(false);
      setShowMeasurementForm(false);

      // 측정 결과를 localStorage에 저장
      if (allResults.length > 0 && selectedMember) {
        const savedMeasurement: SavedMeasurement = {
          memberId: selectedMemberId,
          measuredAt: new Date().toISOString(),
          results: allResults,
          totalSummary: apiResponse?.data?.totalSummary,
          selectedExerciseTypes: selectedExerciseTypes,
          member: {
            name: selectedMember.name,
            age: selectedMember.age,
            gender: selectedMember.gender,
            height: selectedMember.height,
            weight: selectedMember.weight,
            notes: selectedMember.notes,
          },
          measurementData: measurementData,
        };
        saveMeasurement(savedMeasurement);
      }

      // 결과가 있으면 모달 표시, 없으면 성공 메시지만 표시
      if (allResults.length > 0) {
        setShowEvaluation(true);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error("측정 데이터 처리 중 오류:", error);
      // 예상치 못한 오류 발생 시에도 데이터 저장 후 성공 메시지 표시
      try {
        addMeasurement(measurementData);

        // 모달에 표시하기 위해 measurementData 저장
        setCurrentMeasurementData(measurementData);

        // 유연성 데이터를 차트용 형식으로 변환 (에러 발생 시에도 표시)
        const flexibilityResults: MeasurementResult[] = selectedExerciseTypes.includes("flexibility")
          ? convertFlexibilityToChartData(measurementData).map((flex) => ({
              categoryId: flex.categoryId,
              exerciseName: flex.exerciseName,
              value: flex.value,
              unit: flex.unit,
              score: flex.score,
              adjustedLevels: {
                beginner: 1,
                novice: 2,
                intermediate: 3,
                advanced: 4,
                elite: 5,
              },
            }))
          : [];

        setApiResponseResults(flexibilityResults);
        setIsSubmitting(false);
        setShowMeasurementForm(false);

        // 측정 결과를 localStorage에 저장 (에러 발생 시에도 저장)
        if (flexibilityResults.length > 0 && selectedMember) {
          const savedMeasurement: SavedMeasurement = {
            memberId: selectedMemberId,
            measuredAt: new Date().toISOString(),
            results: flexibilityResults,
            selectedExerciseTypes: selectedExerciseTypes,
            member: {
              name: selectedMember.name,
              age: selectedMember.age,
              gender: selectedMember.gender,
              height: selectedMember.height,
              weight: selectedMember.weight,
              notes: selectedMember.notes,
            },
            measurementData: measurementData,
          };
          saveMeasurement(savedMeasurement);
        }

        // 유연성 결과가 있으면 모달 표시, 없으면 성공 메시지만 표시
        if (flexibilityResults.length > 0) {
          setShowEvaluation(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        }
      } catch (fallbackError) {
        console.error("데이터 저장 실패:", fallbackError);
        setIsSubmitting(false);
        alert("측정 데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    setApiResponseResults([]);
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
                            {items.map(({ section, component: Component }, index) => {
                              // categoryId 찾기
                              const categoryInfo = REQUIRED_CATEGORIES.find((cat) => cat.fieldName === section.kgField);
                              const categoryId = categoryInfo?.categoryId;
                              const isMissing = categoryId ? missingCategoryIds.has(categoryId) : false;

                              return (
                                <div
                                  key={`${section.category}-${section.prefix}-${index}`}
                                  className={`bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow ${
                                    isMissing ? "border-red-500 ring-2 ring-red-200 bg-red-50" : "border-gray-200"
                                  }`}
                                >
                                  <Component
                                    section={section}
                                    inputRef={(el: HTMLInputElement | null) => {
                                      if (categoryId) {
                                        inputRefs.current[categoryId] = el;
                                      }
                                    }}
                                    isMissing={isMissing}
                                  />
                                </div>
                              );
                            })}
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
                    disabled={isSubmitting || !selectedMemberId}
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

      {/* 측정 결과 모달 */}
      {showEvaluation && selectedMember && (
        <EvaluationModal
          results={apiResponseResults}
          selectedExerciseTypes={selectedExerciseTypes}
          member={{
            name: selectedMember.name,
            age: selectedMember.age,
            gender: selectedMember.gender,
            height: selectedMember.height,
            weight: selectedMember.weight,
            notes: selectedMember.notes,
          }}
          measurementData={currentMeasurementData}
          onClose={handleCloseEvaluation}
        />
      )}
    </div>
  );
}
