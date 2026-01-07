"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateMeasurementsApi, CalculateMeasurementsResponse, MeasurementResult } from "@/lib/api";

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

// 총평 생성 관련 타입
interface EvaluationResult {
  basicInfo: string;
  exerciseEvaluations: ExerciseEvaluation[];
  summary: string;
}

interface ExerciseEvaluation {
  name: string;
  emoji: string;
  weightKg: number;
  unit?: string; // API 응답의 unit (kg 또는 reps)
  ratio: number;
  ratioText: string;
  levelText: string;
  level: string; // API 응답의 level
  score: number; // API 응답의 score
  nextLevel: string;
  nextLevelTarget: number;
  remaining: number;
  issues: string[];
  evaluation: string;
}

// Score를 레벨명으로 변환
function getLevelName(score: number): string {
  switch (score) {
    case 1:
      return "입문자";
    case 2:
      return "초급자";
    case 3:
      return "중급자";
    case 4:
      return "상급자";
    case 5:
      return "엘리트";
    default:
      return "평가 없음";
  }
}

// API 응답을 기반으로 총평 생성 함수
function generateEvaluationFromApiResponse(member: any, apiResponse: CalculateMeasurementsResponse, measurementData: any): EvaluationResult {
  const weight = member.weight;
  const age = member.age;
  const gender = member.gender === "male" ? "남성" : "여성";
  const height = member.height;
  const name = member.name;
  const notes = member.notes || "";

  // 기본 정보 요약
  const overallLevel = apiResponse.data.totalSummary.overallLevel;
  const overallLevelName = getLevelName(apiResponse.data.totalSummary.averageScore);
  let basicInfo = `${name} 회원님은\n${age}세 / ${gender} / ${height}cm / ${weight}kg 체형으로\n`;
  basicInfo += `체중 대비 전신 근력은 ${overallLevelName} 수준(${overallLevel})으로 평가됩니다.`;

  if (notes) {
    basicInfo += `\n다만 ${notes} 부상 이력이 있어 해당 부위 동작의 깊이와 안정성에서 제한이 관찰됩니다.`;
  }

  const exerciseEvaluations: ExerciseEvaluation[] = [];
  const allIssues: string[] = [];

  // 운동별 매핑 정보
  const exerciseMap: { [key: number]: { name: string; emoji: string; key: string; issues: string[] } } = {
    1: { name: "가슴 – 벤치프레스", emoji: "💪", key: "bench", issues: [] },
    2: { name: "등 – 풀업", emoji: "🧲", key: "pullup", issues: [] },
    3: { name: "어깨 – 숄더프레스", emoji: "🏋️", key: "shoulder", issues: [] },
    4: { name: "하체 – 바벨 스쿼트", emoji: "🦵", key: "squat", issues: [] },
    5: { name: "코어 – 윗몸일으키기", emoji: "💪", key: "situp", issues: [] },
  };

  // API 결과를 기반으로 평가 생성
  apiResponse.data.results.forEach((result: MeasurementResult) => {
    const exerciseInfo = exerciseMap[result.categoryId];
    if (!exerciseInfo) return;

    // 문제점 수집
    const issues: string[] = [];

    if (result.categoryId === 1) {
      // 벤치프레스
      if (measurementData.benchImbalance) issues.push("좌우 힘 차이 인지됨 → 안정성 문제");
      if (measurementData.benchShoulderDiscomfort) issues.push("어깨 불편감");
      if (measurementData.benchRangeLimit) issues.push("가동 범위 제한");
      if (measurementData.benchScapula) issues.push("견갑 고정 어려움");
    } else if (result.categoryId === 2) {
      // 풀업
      if (measurementData.pullupArms) issues.push("팔 위주 사용 → 광배 개입 부족");
      if (measurementData.pullupLatsFeel) issues.push("광배 자극 인지 어려움");
      if (measurementData.pullupBounce) issues.push("반동 사용");
      if (measurementData.pullupScapula) issues.push("견갑 조절 어려움");
    } else if (result.categoryId === 3) {
      // 숄더프레스
      if (measurementData.shoulderPain) issues.push("어깨 통증");
      if (measurementData.shoulderOverextend) issues.push("허리 과신전 발생");
      if (measurementData.shoulderRange) issues.push("가동 범위 제한");
      if (measurementData.shoulderCore) issues.push("코어 불안정");
    } else if (result.categoryId === 4) {
      // 바벨 스쿼트
      if (measurementData.squatDepth) {
        issues.push("병렬 이하 스쿼트 깊이 제한");
        if (notes?.includes("무릎")) {
          issues.push("무릎 부상 이력과 연관 가능성 높음");
        }
      }
      if (measurementData.squatKneePain) issues.push("무릎 통증 발생");
      if (measurementData.squatLowerBack) issues.push("허리 부담");
      if (measurementData.squatBalance) issues.push("좌우 밸런스 불안정");
    } else if (result.categoryId === 5) {
      // 윗몸일으키기
      if (measurementData.situpLowerBack) issues.push("허리 불편감");
      if (measurementData.situpBounce) issues.push("반동 사용");
      if (measurementData.situpCoreTension) issues.push("코어 긴장 유지 어려움");
      if (measurementData.situpBodyShake) issues.push("상체 흔들림");
    }

    const levelName = getLevelName(result.score);
    const ratio = weight > 0 ? result.value / weight : 0;
    const ratioText = ratio.toFixed(2);

    let evaluation = "";
    if (issues.length > 0) {
      evaluation = `${exerciseInfo.name.split("–")[0].trim()} 근력은 ${levelName} 수준이나,\n`;
      if (result.categoryId === 4 && measurementData.squatDepth) {
        evaluation += `가동범위 제한으로 실제 활용 가능한 근력은 낮아져 있는 상태입니다.`;
      } else if (result.categoryId === 1 && measurementData.benchImbalance) {
        evaluation += `좌우 밸런스 불균형으로 중량 상승에 제약이 있습니다.`;
      } else if (result.categoryId === 2 && measurementData.pullupArms) {
        evaluation += `등 근육이 아닌 팔에 힘이 집중되는 패턴이 나타납니다.`;
      } else {
        evaluation += `${issues[0]} 등의 문제가 관찰됩니다.`;
      }
    } else {
      evaluation = `${exerciseInfo.name.split("–")[0].trim()} 근력은 ${levelName} 수준으로 평가됩니다.`;
    }

    exerciseEvaluations.push({
      name: exerciseInfo.name,
      emoji: exerciseInfo.emoji,
      weightKg: result.value,
      unit: result.unit,
      ratio,
      ratioText,
      levelText: levelName,
      level: result.level,
      score: result.score,
      nextLevel: result.nextLevel,
      nextLevelTarget: result.nextLevelTarget,
      remaining: result.remaining,
      issues,
      evaluation,
    });

    allIssues.push(...issues.map((issue) => `${exerciseInfo.name.split("–")[0].trim()}: ${issue}`));
  });

  // 최종 종합 총평
  let summary = `${name} 회원님은\n`;
  summary += `전반적인 근력은 ${overallLevelName} 수준(${overallLevel})이며,\n`;

  if (allIssues.length > 0) {
    const mainIssues = allIssues.slice(0, 3);
    summary += mainIssues.join(", ") + "로 인해\n";
  }

  summary += `실제 운동 효율이 떨어지고 있는 상태입니다.\n\n`;
  summary += apiResponse.data.totalSummary.description;

  return {
    basicInfo,
    exerciseEvaluations,
    summary,
  };
}

// 총평 생성 함수 (기존 함수 - 하위 호환성 유지)
function generateEvaluation(member: any, measurementData: any): EvaluationResult {
  const weight = member.weight;
  const age = member.age;
  const gender = member.gender === "male" ? "남성" : "여성";
  const height = member.height;
  const name = member.name;
  const notes = member.notes || "";

  // 기본 정보 요약
  let basicInfo = `${name} 회원님은\n${age}세 / ${gender} / ${height}cm / ${weight}kg 체형으로\n`;

  // 체중 대비 근력 평가
  let totalStrength = 0;
  let exerciseCount = 0;

  if (measurementData.squatKg) {
    totalStrength += measurementData.squatKg / weight;
    exerciseCount++;
  }
  if (measurementData.benchKg) {
    totalStrength += measurementData.benchKg / weight;
    exerciseCount++;
  }
  // if (measurementData.latKg) {
  //   totalStrength += measurementData.latKg / weight;
  //   exerciseCount++;
  // }
  if (measurementData.shoulderKg) {
    totalStrength += measurementData.shoulderKg / weight;
    exerciseCount++;
  }

  const avgRatio = exerciseCount > 0 ? totalStrength / exerciseCount : 0;
  let strengthLevel = "";
  if (avgRatio >= 1.2) {
    strengthLevel = "우수한";
  } else if (avgRatio >= 0.9) {
    strengthLevel = "중간 이상";
  } else if (avgRatio >= 0.7) {
    strengthLevel = "기본";
  } else {
    strengthLevel = "기본 이하";
  }

  basicInfo += `체중 대비 전신 근력은 ${strengthLevel} 수준으로 평가됩니다.`;

  if (notes) {
    basicInfo += `\n다만 ${notes} 부상 이력이 있어 해당 부위 동작의 깊이와 안정성에서 제한이 관찰됩니다.`;
  }

  const exerciseEvaluations: ExerciseEvaluation[] = [];
  const allIssues: string[] = [];

  // 하체 - 바벨 스쿼트
  if (measurementData.squatKg) {
    const ratio = measurementData.squatKg / weight;
    const ratioText = ratio.toFixed(2);
    let levelText = "";
    if (ratio >= 1.5) levelText = "우수";
    else if (ratio >= 1.0) levelText = "평균 이상";
    else if (ratio >= 0.8) levelText = "일반 성인 남성 평균 범위";
    else levelText = "평균 이하";

    const issues: string[] = [];
    if (measurementData.squatDepth) {
      issues.push("병렬 이하 스쿼트 깊이 제한");
      if (notes?.includes("무릎")) {
        issues.push("무릎 부상 이력과 연관 가능성 높음");
      }
    }
    if (measurementData.squatKneePain) issues.push("무릎 통증 발생");
    if (measurementData.squatLowerBack) issues.push("허리 부담");
    if (measurementData.squatBalance) issues.push("좌우 밸런스 불안정");

    let evaluation = "";
    if (issues.length > 0) {
      evaluation = `하체 근력 자체는 ${levelText}이나,\n가동범위 제한으로 실제 활용 가능한 근력은 낮아져 있는 상태입니다.`;
    } else {
      evaluation = `하체 근력은 ${levelText} 수준으로 평가됩니다.`;
    }

    exerciseEvaluations.push({
      name: "하체 – 바벨 스쿼트",
      emoji: "🦵",
      weightKg: measurementData.squatKg,
      ratio,
      ratioText,
      levelText,
      level: "",
      score: 0,
      nextLevel: "",
      nextLevelTarget: 0,
      remaining: 0,
      issues,
      evaluation,
    });

    allIssues.push(...issues.map((issue) => `하체: ${issue}`));
  }

  // 가슴 - 벤치프레스
  if (measurementData.benchKg) {
    const ratio = measurementData.benchKg / weight;
    const ratioText = ratio.toFixed(2);
    let levelText = "";
    if (ratio >= 1.2) levelText = "평균 이상";
    else if (ratio >= 0.85) levelText = "평균 이하 ~ 평균 경계";
    else levelText = "평균 이하";

    const issues: string[] = [];
    if (measurementData.benchImbalance) {
      issues.push("좌우 힘 차이 인지됨 → 안정성 문제");
    }
    if (measurementData.benchShoulderDiscomfort) issues.push("어깨 불편감");
    if (measurementData.benchRangeLimit) issues.push("가동 범위 제한");
    if (measurementData.benchScapula) issues.push("견갑 고정 어려움");

    let evaluation = "";
    if (measurementData.benchImbalance) {
      evaluation = `가슴 근력은 기본은 확보되어 있으나,\n좌우 밸런스 불균형으로 중량 상승에 제약이 있습니다.`;
    } else {
      evaluation = `가슴 근력은 ${levelText} 수준으로 평가됩니다.`;
    }

    exerciseEvaluations.push({
      name: "가슴 – 벤치프레스",
      emoji: "💪",
      weightKg: measurementData.benchKg,
      ratio,
      ratioText,
      levelText,
      level: "",
      score: 0,
      nextLevel: "",
      nextLevelTarget: 0,
      remaining: 0,
      issues,
      evaluation,
    });

    allIssues.push(...issues.map((issue) => `가슴: ${issue}`));
  }

  // // 등 - 랫풀다운
  // if (measurementData.latKg) {
  //   const ratio = measurementData.latKg / weight;
  //   const ratioText = ratio.toFixed(2);
  //   let levelText = "";
  //   if (ratio >= 1.0) levelText = "평균 이상";
  //   else if (ratio >= 0.8) levelText = "수치 자체는 정상";
  //   else levelText = "평균 이하";

  //   const issues: string[] = [];
  //   if (measurementData.latArms) {
  //     issues.push("팔 위주 사용 → 광배 개입 부족");
  //   }
  //   if (measurementData.latLatsFeel) issues.push("광배 자극 인지 어려움");
  //   if (measurementData.latBounce) issues.push("반동 사용");
  //   if (measurementData.latScapula) issues.push("견갑 조절 어려움");

  //   let evaluation = "";
  //   if (measurementData.latArms) {
  //     evaluation = `등 근력 수치는 나쁘지 않으나,\n등 근육이 아닌 팔에 힘이 집중되는 패턴이 나타납니다.`;
  //   } else {
  //     evaluation = `등 근력은 ${levelText} 수준으로 평가됩니다.`;
  //   }

  //   exerciseEvaluations.push({
  //     name: "등 – 랫풀다운",
  //     emoji: "🧲",
  //     weightKg: measurementData.latKg,
  //     ratio,
  //     ratioText,
  //     levelText,
  //     level: "",
  //     score: 0,
  //     nextLevel: "",
  //     nextLevelTarget: 0,
  //     remaining: 0,
  //     issues,
  //     evaluation,
  //   });

  //   allIssues.push(...issues.map((issue) => `등: ${issue}`));
  // }

  // 어깨 - 숄더프레스
  if (measurementData.shoulderKg) {
    const ratio = measurementData.shoulderKg / weight;
    const ratioText = ratio.toFixed(2);
    let levelText = "";
    if (ratio >= 0.6) levelText = "평균";
    else if (ratio >= 0.4) levelText = "평균 이하";
    else levelText = "저조";

    const issues: string[] = [];
    if (measurementData.shoulderPain) issues.push("어깨 통증");
    if (measurementData.shoulderOverextend) issues.push("허리 과신전 발생");
    if (measurementData.shoulderRange) issues.push("가동 범위 제한");
    if (measurementData.shoulderCore) issues.push("코어 불안정");

    let evaluation = "";
    if (ratio < 0.5) {
      evaluation = `상체 프레스 계열 중 어깨 근력이 상대적으로 약해\n상체 전반의 안정성 보완이 필요한 상태입니다.`;
    } else {
      evaluation = `어깨 근력은 ${levelText} 수준으로 평가됩니다.`;
      if (issues.length > 0) {
        evaluation += `\n다만 ${issues[0]} 등의 문제가 관찰됩니다.`;
      }
    }

    exerciseEvaluations.push({
      name: "어깨 – 숄더프레스",
      emoji: "🏋️",
      weightKg: measurementData.shoulderKg,
      ratio,
      ratioText,
      levelText,
      level: "",
      score: 0,
      nextLevel: "",
      nextLevelTarget: 0,
      remaining: 0,
      issues,
      evaluation,
    });

    allIssues.push(...issues.map((issue) => `어깨: ${issue}`));
  }

  // 최종 종합 총평
  let summary = `${name} 회원님은\n`;
  summary += `전반적인 근력은 ${strengthLevel} 수준이나,\n`;

  if (allIssues.length > 0) {
    const mainIssues = allIssues.slice(0, 3);
    summary += mainIssues.join(", ") + "로 인해\n";
  }

  summary += `실제 운동 효율이 떨어지고 있는 상태입니다.\n\n`;
  summary += `초기 프로그램은 중량 증가보다 움직임 개선과 안정성 확보에 초점을 두는 것이 적절합니다.`;

  return {
    basicInfo,
    exerciseEvaluations,
    summary,
  };
}

// 운동 타입 정의
type ExerciseType = "flexibility" | "bodyweight" | "weight";

// 운동 섹션 타입 정의
interface ExerciseSection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType?: "kg" | "reps" | "flexibility"; // 필드 타입: 무게, 횟수, 또는 유연성
  options: { name: string; label: string }[];
  category: ExerciseType;
}

// 운동 섹션 데이터
const exerciseSections: ExerciseSection[] = [
  {
    title: "[하체] 바벨 스쿼트",
    prefix: "squat",
    kgField: "squatKg",
    category: "weight",
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
    category: "weight",
    options: [
      { name: "benchShoulderDiscomfort", label: "어깨 불편감" },
      { name: "benchRangeLimit", label: "가동 범위 제한" },
      { name: "benchImbalance", label: "좌우 힘 차이 느낌" },
      { name: "benchScapula", label: "견갑 고정 어려움" },
    ],
  },
  // {
  //   title: "[등] 랫풀다운",
  //   prefix: "lat",
  //   kgField: "latKg",
  //   category: "weight",
  //   options: [
  //     { name: "latArms", label: "팔 위주로 당겨짐" },
  //     { name: "latLatsFeel", label: "광배 자극 인지 어려움" },
  //     { name: "latBounce", label: "반동 사용" },
  //     { name: "latScapula", label: "견갑 조절 어려움" },
  //   ],
  // },
  {
    title: "[어깨] 숄더프레스",
    prefix: "shoulder",
    kgField: "shoulderKg",
    category: "weight",
    options: [
      { name: "shoulderOverextend", label: "허리 과신전 발생" },
      { name: "shoulderPain", label: "어깨 통증" },
      { name: "shoulderRange", label: "가동 범위 제한" },
      { name: "shoulderCore", label: "코어 불안정" },
    ],
  },
  {
    title: "[등] 풀업",
    prefix: "pullup",
    kgField: "pullupReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "pullupArms", label: "팔 위주로 당겨짐" },
      { name: "pullupLatsFeel", label: "광배 자극 인지 어려움" },
      { name: "pullupBounce", label: "반동 사용" },
      { name: "pullupScapula", label: "견갑 조절 어려움" },
    ],
  },
  {
    title: "[코어] 윗몸일으키기",
    prefix: "situp",
    kgField: "situpReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "situpLowerBack", label: "허리 불편감" },
      { name: "situpBounce", label: "반동 사용" },
      { name: "situpCoreTension", label: "코어 긴장 유지 어려움" },
      { name: "situpBodyShake", label: "상체 흔들림" },
    ],
  },
  {
    title: "[상체] 흉추 가동성 테스트",
    prefix: "thoracic",
    kgField: "thoracicMobility",
    fieldType: "flexibility",
    category: "flexibility",
    options: [],
  },
  {
    title: "[상체] 어깨 유연성 테스트 (굽힘/폄/외전/내전/외회전/내회전)",
    prefix: "shoulderFlexibility",
    kgField: "shoulderFlexibility",
    fieldType: "flexibility",
    category: "flexibility",
    options: [],
  },
  {
    title: "[하체] 햄스트링",
    prefix: "hamstring",
    kgField: "hamstring",
    fieldType: "flexibility",
    category: "flexibility",
    options: [],
  },
  {
    title: "[하체] 고관절 테스트 (굴곡/신전/스쿼트각도)",
    prefix: "hip",
    kgField: "hipMobility",
    fieldType: "flexibility",
    category: "flexibility",
    options: [],
  },
  {
    title: "[하체] 발목 가동성",
    prefix: "ankle",
    kgField: "ankleMobility",
    fieldType: "flexibility",
    category: "flexibility",
    options: [],
  },
];

// 운동 섹션 컴포넌트
function ExerciseSection({ section }: { section: ExerciseSection }) {
  const fieldType = section.fieldType || "kg";
  const fieldLabel = fieldType === "reps" ? "횟수 (회)" : fieldType === "flexibility" ? "평가" : "무게 (kg)";
  const placeholder = fieldType === "reps" ? "횟수" : fieldType === "flexibility" ? "" : "무게";

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
      {fieldType === "flexibility" ? (
        <div className="mt-4">
          <div className="font-medium mb-3 text-gray-700">평가 선택</div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center">
              <input type="radio" name={section.kgField} value="good" className="form-radio text-green-600" />
              <span className="ml-2">좋음</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name={section.kgField} value="normal" className="form-radio text-green-600" />
              <span className="ml-2">보통</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name={section.kgField} value="low" className="form-radio text-green-600" />
              <span className="ml-2">낮음</span>
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="max-w-xs">
            <div>
              <label className="block font-medium mb-1 text-gray-700" htmlFor={section.kgField}>
                {fieldLabel}
              </label>
              <input id={section.kgField} name={section.kgField} type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder={placeholder} />
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
        </>
      )}
    </div>
  );
}

export default function MeasurementPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const { members } = useMemberStore();
  const addMeasurement = useMeasurementStore((state) => state.addMeasurement);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedExerciseTypes, setSelectedExerciseTypes] = useState<ExerciseType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // 검색 필터링된 회원 목록
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((member) => member.name.toLowerCase().includes(query) || member.age.toString().includes(query) || (member.gender === "male" ? "남" : "여").includes(query));
  }, [members, searchQuery]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // 선택한 운동 타입에 맞는 운동 섹션 필터링
  const filteredExerciseSections = useMemo(() => {
    if (selectedExerciseTypes.length === 0) return [];
    return exerciseSections.filter((section) => selectedExerciseTypes.includes(section.category));
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
    const measurementData: any = {
      memberId: selectedMemberId,
      memberName: selectedMember.name,
      exerciseTypes: selectedExerciseTypes,
      // 체성분
      muscle: getNumber(formData, "muscle"),
      bodyfat: getNumber(formData, "bodyfat"),
      beforeIntenseExercise: getCheckbox(formData, "beforeIntenseExercise"),
      waterIntakeDifferent: getCheckbox(formData, "waterIntakeDifferent"),
      recentWeightChange: getCheckbox(formData, "recentWeightChange"),
      // 운동별 데이터
      squatKg: getNumber(formData, "squatKg"),
      squatDepth: getCheckbox(formData, "squatDepth"),
      squatKneePain: getCheckbox(formData, "squatKneePain"),
      squatLowerBack: getCheckbox(formData, "squatLowerBack"),
      squatBalance: getCheckbox(formData, "squatBalance"),
      benchKg: getNumber(formData, "benchKg"),
      benchShoulderDiscomfort: getCheckbox(formData, "benchShoulderDiscomfort"),
      benchRangeLimit: getCheckbox(formData, "benchRangeLimit"),
      benchImbalance: getCheckbox(formData, "benchImbalance"),
      benchScapula: getCheckbox(formData, "benchScapula"),
      // latKg: getNumber(formData, "latKg"),
      // latArms: getCheckbox(formData, "latArms"),
      // latLatsFeel: getCheckbox(formData, "latLatsFeel"),
      // latBounce: getCheckbox(formData, "latBounce"),
      // latScapula: getCheckbox(formData, "latScapula"),
      shoulderKg: getNumber(formData, "shoulderKg"),
      shoulderOverextend: getCheckbox(formData, "shoulderOverextend"),
      shoulderPain: getCheckbox(formData, "shoulderPain"),
      shoulderRange: getCheckbox(formData, "shoulderRange"),
      shoulderCore: getCheckbox(formData, "shoulderCore"),
      pullupReps: getNumber(formData, "pullupReps", true),
      pullupArms: getCheckbox(formData, "pullupArms"),
      pullupLatsFeel: getCheckbox(formData, "pullupLatsFeel"),
      pullupBounce: getCheckbox(formData, "pullupBounce"),
      pullupScapula: getCheckbox(formData, "pullupScapula"),
      situpReps: getNumber(formData, "situpReps", true),
      situpLowerBack: getCheckbox(formData, "situpLowerBack"),
      situpBounce: getCheckbox(formData, "situpBounce"),
      situpCoreTension: getCheckbox(formData, "situpCoreTension"),
      situpBodyShake: getCheckbox(formData, "situpBodyShake"),
      // 유연성 데이터
      thoracicMobility: formData.get("thoracicMobility") as string | null,
      shoulderFlexibility: formData.get("shoulderFlexibility") as string | null,
      hamstring: formData.get("hamstring") as string | null,
      hipMobility: formData.get("hipMobility") as string | null,
      ankleMobility: formData.get("ankleMobility") as string | null,
    };

    try {
      // API 호출을 위한 측정 데이터 변환
      // categoryId 매핑: 1=벤치프레스, 2=풀업, 3=숄더프레스, 4=바벨스쿼트, 5=윗몸일으키기
      const measurements: Array<{ categoryId: number; value: number }> = [];

      if (measurementData.benchKg) {
        measurements.push({ categoryId: 1, value: measurementData.benchKg });
      }
      if (measurementData.pullupReps) {
        measurements.push({ categoryId: 2, value: measurementData.pullupReps });
      }
      if (measurementData.shoulderKg) {
        measurements.push({ categoryId: 3, value: measurementData.shoulderKg });
      }
      if (measurementData.squatKg) {
        measurements.push({ categoryId: 4, value: measurementData.squatKg });
      }
      if (measurementData.situpReps) {
        measurements.push({ categoryId: 5, value: measurementData.situpReps });
      }

      // API 호출
      let apiResponse: CalculateMeasurementsResponse | null = null;
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
      let evaluation: EvaluationResult;
      if (apiResponse) {
        evaluation = generateEvaluationFromApiResponse(selectedMember, apiResponse, measurementData);
      } else {
        evaluation = generateEvaluation(selectedMember, measurementData);
      }

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

                {members.length === 0 ? (
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50 text-center">
                    <p className="text-gray-600 mb-2">등록된 회원이 없습니다.</p>
                    <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium underline">
                      회원정보등록 페이지로 이동
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* 검색 바 */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="회원 이름, 나이, 성별로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                      />
                    </div>

                    {/* 회원 목록 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <div className="col-span-2 text-center py-4 text-gray-500">검색 결과가 없습니다.</div>
                      ) : (
                        filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              selectedMemberId === member.id ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="font-semibold text-gray-800 mb-1">{member.name}</div>
                            <div className="text-sm text-gray-600">
                              {member.gender === "male" ? "남" : "여"} | {member.age}세 | {member.height}cm | {member.weight}kg
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* 선택된 회원 정보 */}
                    {selectedMember && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">선택된 회원:</span> {selectedMember.name} | 성별: {selectedMember.gender === "male" ? "남" : "여"} | 나이: {selectedMember.age}세 | 키:{" "}
                          {selectedMember.height}cm | 몸무게: {selectedMember.weight}kg
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 운동 선택 섹션 */}
              {selectedMemberId && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">측정할 운동 선택 (복수 선택 가능)</h2>
                  {/* 선택된 운동 타입에 따라 검사할 구체적인 운동 표시 */}
                  {selectedExerciseTypes.length > 0 && filteredExerciseSections.length > 0 && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-semibold text-gray-700 mb-2">검사할 운동:</p>
                      <div className="flex flex-wrap gap-2">
                        {filteredExerciseSections.map((section) => (
                          <span key={section.prefix} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {section.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => toggleExerciseType("flexibility")}
                      className={`p-6 border-2 rounded-lg text-center transition-all ${
                        selectedExerciseTypes.includes("flexibility") ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-4xl mb-2">🧘</div>
                      <div className="font-semibold text-gray-800">유연성</div>
                      {selectedExerciseTypes.includes("flexibility") && <div className="mt-2 text-sm text-green-600 font-medium">✓ 선택됨</div>}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExerciseType("bodyweight")}
                      className={`p-6 border-2 rounded-lg text-center transition-all ${
                        selectedExerciseTypes.includes("bodyweight") ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-4xl mb-2">💪</div>
                      <div className="font-semibold text-gray-800">맨몸운동</div>
                      {selectedExerciseTypes.includes("bodyweight") && <div className="mt-2 text-sm text-green-600 font-medium">✓ 선택됨</div>}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExerciseType("weight")}
                      className={`p-6 border-2 rounded-lg text-center transition-all ${
                        selectedExerciseTypes.includes("weight") ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-4xl mb-2">🏋️</div>
                      <div className="font-semibold text-gray-800">웨이트 트레이닝</div>
                      {selectedExerciseTypes.includes("weight") && <div className="mt-2 text-sm text-green-600 font-medium">✓ 선택됨</div>}
                    </button>
                  </div>
                  {selectedExerciseTypes.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                      선택된 운동: {selectedExerciseTypes.map((type) => (type === "flexibility" ? "유연성" : type === "bodyweight" ? "맨몸운동" : "웨이트 트레이닝")).join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* 다음 버튼 */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white text-lg font-semibold rounded-md py-3 hover:from-green-500 hover:to-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:from-gray-300 disabled:hover:to-gray-300"
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
                    {filteredExerciseSections.map((section) => (
                      <div key={section.prefix} className="border-b border-gray-200 pb-6">
                        <ExerciseSection section={section} />
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
      {showEvaluation && evaluationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">📋 측정 결과 총평</h2>
              <button onClick={handleCloseEvaluation} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">기본 정보</h3>
                <p className="text-gray-700 whitespace-pre-line">{evaluationResult.basicInfo}</p>
              </div>

              {/* 부위별 총평 */}
              {evaluationResult.exerciseEvaluations.map((exerciseEval, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{exerciseEval.emoji}</span>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {exerciseEval.name} ({exerciseEval.unit === "reps" ? "횟수" : "1RM"} {exerciseEval.weightKg}
                      {exerciseEval.unit === "reps" ? "회" : "kg"})
                    </h3>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-blue-100 px-3 py-1 rounded-md">
                        <span className="text-sm font-semibold text-blue-800">
                          레벨: {exerciseEval.levelText || exerciseEval.level} (Score: {exerciseEval.score})
                        </span>
                      </div>
                      {exerciseEval.nextLevelTarget > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">다음 레벨 목표:</span> {exerciseEval.nextLevelTarget.toFixed(2)}
                          {exerciseEval.name.includes("윗몸") ? "회" : "kg"}
                          {exerciseEval.remaining > 0 && (
                            <span className="ml-2 text-orange-600">
                              (부족: {exerciseEval.remaining.toFixed(2)}
                              {exerciseEval.name.includes("윗몸") ? "회" : "kg"})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {exerciseEval.unit !== "reps" && (
                      <div className="text-sm text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">체중 대비 비율:</span> {exerciseEval.ratioText}배
                        </div>
                      </div>
                    )}
                    {exerciseEval.issues.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-red-600 mb-1">문제점:</div>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {exerciseEval.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-gray-700 whitespace-pre-line">{exerciseEval.evaluation}</p>
                  </div>
                </div>
              ))}

              {/* 최종 종합 총평 */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-xl text-gray-800 mb-3">📊 종합 총평</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{evaluationResult.summary}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCloseEvaluation}
                  className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-2 rounded-md font-semibold hover:from-green-500 hover:to-green-700 transition"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
