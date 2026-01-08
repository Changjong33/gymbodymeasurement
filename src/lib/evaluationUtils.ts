import { CalculateMeasurementsResponse, MeasurementResult, TotalSummary } from "./api";

// 총평 생성 관련 타입
export interface EvaluationResult {
  basicInfo: string;
  exerciseEvaluations: ExerciseEvaluation[];
  summary: string;
}

export interface ExerciseEvaluation {
  name: string;
  emoji: string;
  weightKg: number;
  unit?: string;
  ratio: number;
  ratioText: string;
  levelText: string;
  level: string;
  score: number;
  nextLevel: string;
  nextLevelTarget: number;
  remaining: number;
  issues: string[];
  evaluation: string;
}

// Score를 레벨명으로 변환 (영어)
export function getLevelName(score: number): string {
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
      return "N/A";
  }
}

// 운동별 문제점 수집
function collectIssuesByCategory(categoryId: number, measurementData: any, notes: string): string[] {
  const issues: string[] = [];

  switch (categoryId) {
    case 1: // 벤치프레스
      if (measurementData.benchImbalance) issues.push("좌우 힘 차이 인지됨 → 안정성 문제");
      if (measurementData.benchShoulderDiscomfort) issues.push("어깨 불편감");
      if (measurementData.benchRangeLimit) issues.push("가동 범위 제한");
      if (measurementData.benchScapula) issues.push("견갑 고정 어려움");
      break;

    case 2: // 풀업
      if (measurementData.pullupArms) issues.push("팔 위주 사용 → 광배 개입 부족");
      if (measurementData.pullupLatsFeel) issues.push("광배 자극 인지 어려움");
      if (measurementData.pullupBounce) issues.push("반동 사용");
      if (measurementData.pullupScapula) issues.push("견갑 조절 어려움");
      break;

    case 3: // 숄더프레스
      if (measurementData.shoulderPain) issues.push("어깨 통증");
      if (measurementData.shoulderOverextend) issues.push("허리 과신전 발생");
      if (measurementData.shoulderRange) issues.push("가동 범위 제한");
      if (measurementData.shoulderCore) issues.push("코어 불안정");
      break;

    case 4: // 바벨 스쿼트
      if (measurementData.squatDepth) {
        issues.push("병렬 이하 스쿼트 깊이 제한");
        if (notes?.includes("무릎")) {
          issues.push("무릎 부상 이력과 연관 가능성 높음");
        }
      }
      if (measurementData.squatKneePain) issues.push("무릎 통증 발생");
      if (measurementData.squatLowerBack) issues.push("허리 부담");
      if (measurementData.squatBalance) issues.push("좌우 밸런스 불안정");
      break;

    case 5: // 윗몸일으키기
      if (measurementData.situpLowerBack) issues.push("허리 불편감");
      if (measurementData.situpBounce) issues.push("반동 사용");
      if (measurementData.situpCoreTension) issues.push("코어 긴장 유지 어려움");
      if (measurementData.situpBodyShake) issues.push("상체 흔들림");
      break;

    case 6: // 바벨 로우
      if (measurementData.barbellRowArms) issues.push("팔 위주로 당겨짐 (등 개입 부족)");
      if (measurementData.barbellRowLatsFeel) issues.push("광배 자극 인지 어려움");
      if (measurementData.barbellRowLowerBack) issues.push("허리 부담 느낌");
      if (measurementData.barbellRowImbalance) issues.push("좌우 힘 차이 느낌");
      break;

    case 7: // 데드리프트
      if (measurementData.deadliftLowerBack) issues.push("허리 부담 느낌");
      if (measurementData.deadliftFormBreakdown) issues.push("동작 정확도 저하 (둥근 등)");
      if (measurementData.deadliftGrip) issues.push("그립 유지 어려움");
      if (measurementData.deadliftBalance) issues.push("균형 불안정");
      break;

    case 8: // 푸쉬업
      if (measurementData.pushupShoulderDiscomfort) issues.push("어깨 불편감");
      if (measurementData.pushupRangeLimit) issues.push("가동 범위 제한");
      if (measurementData.pushupImbalance) issues.push("좌우 힘 차이 느낌");
      if (measurementData.pushupCoreUnstable) issues.push("코어 불안정 (허리 처짐)");
      break;

    case 9: // 스쿼트 (맨몸)
      if (measurementData.bodyweightSquatDepth) {
        issues.push("스쿼트 깊이 제한적 (병렬 이하 어려움)");
        if (notes?.includes("무릎")) {
          issues.push("무릎 부상 이력과 연관 가능성 높음");
        }
      }
      if (measurementData.bodyweightSquatKneePain) issues.push("무릎 통증 발생");
      if (measurementData.bodyweightSquatLowerBack) issues.push("허리 부담 느낌");
      if (measurementData.bodyweightSquatBalance) issues.push("좌우 밸런스 불안정");
      break;

    case 10: // 버피
      if (measurementData.burpeeBreathing) issues.push("호흡 조절 어려움");
      if (measurementData.burpeeFormBreakdown) issues.push("동작 정확도 저하");
      if (measurementData.burpeeLowerBack) issues.push("허리 불편감");
      if (measurementData.burpeeEndurance) issues.push("지구력 부족 (빠른 피로)");
      break;

    // 유연성 (11-15)은 일반적으로 문제점이 없음
  }

  return issues;
}

// 문제점 기반 평가 텍스트 생성 - 텍스트 제거
function generateEvaluationText(categoryId: number, exerciseName: string, levelName: string, issues: string[], measurementData: any): string {
  return ""; // 텍스트 코멘트 제거
}

// Mock 데이터 생성 함수 (API 실패 시 사용)
export function generateMockMeasurementsResponse(measurementData: any, selectedExerciseTypes: string[]): CalculateMeasurementsResponse {
  const results: MeasurementResult[] = [];

  // 웨이트 트레이닝 (categoryId 1-7)
  if (selectedExerciseTypes.includes("weight")) {
    if (measurementData.benchKg) {
      const ratio = measurementData.benchKg / (measurementData.memberWeight || 70);
      const score = Math.min(5, Math.max(1, Math.floor((ratio / 1.2) * 3) + 1));
      results.push({
        categoryId: 1,
        exerciseName: "가슴 – 벤치프레스",
        value: measurementData.benchKg,
        unit: "kg",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.benchKg * 1.15,
        remaining: measurementData.benchKg * 0.15,
      });
    }
    if (measurementData.shoulderKg) {
      const ratio = measurementData.shoulderKg / (measurementData.memberWeight || 70);
      const score = Math.min(5, Math.max(1, Math.floor((ratio / 0.6) * 3) + 1));
      results.push({
        categoryId: 3,
        exerciseName: "어깨 – 숄더프레스",
        value: measurementData.shoulderKg,
        unit: "kg",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.shoulderKg * 1.15,
        remaining: measurementData.shoulderKg * 0.15,
      });
    }
    if (measurementData.squatKg) {
      const ratio = measurementData.squatKg / (measurementData.memberWeight || 70);
      const score = Math.min(5, Math.max(1, Math.floor((ratio / 1.5) * 3) + 1));
      results.push({
        categoryId: 4,
        exerciseName: "하체 – 바벨 스쿼트",
        value: measurementData.squatKg,
        unit: "kg",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.squatKg * 1.15,
        remaining: measurementData.squatKg * 0.15,
      });
    }
    if (measurementData.barbellRowKg) {
      const ratio = measurementData.barbellRowKg / (measurementData.memberWeight || 70);
      const score = Math.min(5, Math.max(1, Math.floor((ratio / 1.0) * 3) + 1));
      results.push({
        categoryId: 6,
        exerciseName: "등 – 바벨 로우",
        value: measurementData.barbellRowKg,
        unit: "kg",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.barbellRowKg * 1.15,
        remaining: measurementData.barbellRowKg * 0.15,
      });
    }
    if (measurementData.deadliftKg) {
      const ratio = measurementData.deadliftKg / (measurementData.memberWeight || 70);
      const score = Math.min(5, Math.max(1, Math.floor((ratio / 1.8) * 3) + 1));
      results.push({
        categoryId: 7,
        exerciseName: "전신 – 데드리프트",
        value: measurementData.deadliftKg,
        unit: "kg",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.deadliftKg * 1.15,
        remaining: measurementData.deadliftKg * 0.15,
      });
    }
  }

  // 맨몸 운동 (categoryId 2, 5, 8-10)
  if (selectedExerciseTypes.includes("bodyweight")) {
    if (measurementData.pullupReps) {
      const score = Math.min(5, Math.max(1, Math.floor(measurementData.pullupReps / 5) + 1));
      results.push({
        categoryId: 2,
        exerciseName: "등 – 풀업",
        value: measurementData.pullupReps,
        unit: "reps",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.pullupReps + 3,
        remaining: 3,
      });
    }
    if (measurementData.situpReps) {
      const score = Math.min(5, Math.max(1, Math.floor(measurementData.situpReps / 20) + 1));
      results.push({
        categoryId: 5,
        exerciseName: "코어 – 윗몸일으키기",
        value: measurementData.situpReps,
        unit: "reps",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.situpReps + 5,
        remaining: 5,
      });
    }
    if (measurementData.pushupReps) {
      const score = Math.min(5, Math.max(1, Math.floor(measurementData.pushupReps / 15) + 1));
      results.push({
        categoryId: 8,
        exerciseName: "가슴 – 푸쉬업",
        value: measurementData.pushupReps,
        unit: "reps",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.pushupReps + 5,
        remaining: 5,
      });
    }
    if (measurementData.bodyweightSquatReps) {
      const score = Math.min(5, Math.max(1, Math.floor(measurementData.bodyweightSquatReps / 30) + 1));
      results.push({
        categoryId: 9,
        exerciseName: "하체 – 스쿼트",
        value: measurementData.bodyweightSquatReps,
        unit: "reps",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.bodyweightSquatReps + 10,
        remaining: 10,
      });
    }
    if (measurementData.burpeeReps) {
      const score = Math.min(5, Math.max(1, Math.floor(measurementData.burpeeReps / 15) + 1));
      results.push({
        categoryId: 10,
        exerciseName: "전신 – 버피",
        value: measurementData.burpeeReps,
        unit: "reps",
        level: getLevelName(score),
        score,
        nextLevel: getLevelName(Math.min(5, score + 1)),
        nextLevelTarget: measurementData.burpeeReps + 5,
        remaining: 5,
      });
    }
  }

  // 유연성 (categoryId 11-15)
  if (selectedExerciseTypes.includes("flexibility")) {
    const flexibilityMap = [
      { id: 11, name: "유연성 – 흉추 가동성", field: "thoracicMobility" },
      { id: 12, name: "유연성 – 어깨 유연성", field: "shoulderFlexibility" },
      { id: 13, name: "유연성 – 햄스트링", field: "hamstring" },
      { id: 14, name: "유연성 – 고관절", field: "hipMobility" },
      { id: 15, name: "유연성 – 발목 가동성", field: "ankleMobility" },
    ];

    flexibilityMap.forEach(({ id, name, field }) => {
      const value = measurementData[field];
      if (value) {
        // 5단계 평가: excellent=5, good=4, normal=3, bad=2, very_bad=1
        const scoreMap: Record<string, number> = {
          excellent: 5,
          good: 4,
          normal: 3,
          bad: 2,
          very_bad: 1,
        };
        const score = scoreMap[value] || 3;
        results.push({
          categoryId: id,
          exerciseName: name,
          value: score,
          unit: "level",
          level: getLevelName(score),
          score,
          nextLevel: getLevelName(Math.min(5, score + 1)),
          nextLevelTarget: score + 1,
          remaining: 1,
        });
      }
    });
  }

  // totalSummary 계산
  const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 3;
  const overallLevel = getLevelName(Math.round(averageScore));

  let description = "전반적인 신체 능력은 ";
  if (averageScore >= 4) {
    description += "우수한 수준입니다. 지속적인 유지와 더 나은 발전을 위해 다양한 운동을 시도해보세요.";
  } else if (averageScore >= 3) {
    description += "평균 이상의 수준입니다. 꾸준한 훈련을 통해 더 향상시킬 수 있습니다.";
  } else {
    description += "기본적인 수준입니다. 체계적인 훈련 계획을 통해 단계적으로 향상시켜 나가시길 권장합니다.";
  }

  return {
    statusCode: 200,
    data: {
      totalSummary: {
        overallLevel,
        averageScore: Math.round(averageScore * 10) / 10,
        description,
      },
      results,
    },
    timestamp: new Date().toISOString(),
  };
}

// API 응답을 기반으로 총평 생성
export function generateEvaluationFromApiResponse(member: any, apiResponse: CalculateMeasurementsResponse, measurementData: any): EvaluationResult {
  const { weight, age, gender, height, name, notes = "" } = member;
  const genderText = gender === "male" ? "남성" : "여성";

  // 기본 정보 요약 - 텍스트 제거 (백엔드의 description 필드는 무시)

  const exerciseEvaluations: ExerciseEvaluation[] = [];

  // 운동별 매핑 정보 (모든 카테고리 포함)
  const exerciseMap: { [key: number]: { name: string; emoji: string } } = {
    1: { name: "가슴 – 벤치프레스", emoji: "💪" },
    2: { name: "등 – 풀업", emoji: "🧲" },
    3: { name: "어깨 – 숄더프레스", emoji: "🏋️" },
    4: { name: "하체 – 바벨 스쿼트", emoji: "🦵" },
    5: { name: "코어 – 윗몸일으키기", emoji: "💪" },
    6: { name: "등 – 바벨 로우", emoji: "🧲" },
    7: { name: "전신 – 데드리프트", emoji: "🏋️" },
    8: { name: "가슴 – 푸쉬업", emoji: "💪" },
    9: { name: "하체 – 스쿼트", emoji: "🦵" },
    10: { name: "전신 – 버피", emoji: "💪" },
    11: { name: "유연성 – 흉추 가동성", emoji: "🧘" },
    12: { name: "유연성 – 어깨 유연성", emoji: "🧘" },
    13: { name: "유연성 – 햄스트링", emoji: "🧘" },
    14: { name: "유연성 – 고관절", emoji: "🧘" },
    15: { name: "유연성 – 발목 가동성", emoji: "🧘" },
  };

  // API 결과를 기반으로 평가 생성
  apiResponse.data.results.forEach((result: MeasurementResult) => {
    const exerciseInfo = exerciseMap[result.categoryId];
    if (!exerciseInfo) return;

    const issues = collectIssuesByCategory(result.categoryId, measurementData, notes);
    const levelName = getLevelName(result.score);
    // 유연성(unit === "level")의 경우 ratio 계산하지 않음
    const isFlexibility = result.categoryId >= 11 && result.categoryId <= 15;
    const ratio = isFlexibility ? 0 : weight > 0 ? result.value / weight : 0;
    const ratioText = ratio > 0 ? ratio.toFixed(2) : "0.00";

    const evaluation = generateEvaluationText(result.categoryId, exerciseInfo.name, levelName, issues, measurementData);

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
      evaluation: "", // 텍스트 코멘트 제거
    });
  });

  // 최종 종합 총평 - 텍스트 제거, 빈 문자열로 설정
  const summary = "";

  return {
    basicInfo: "", // 텍스트 코멘트 제거
    exerciseEvaluations,
    summary, // 텍스트 코멘트 제거
  };
}

// 기존 방식의 총평 생성 (하위 호환성)
export function generateEvaluation(member: any, measurementData: any): EvaluationResult {
  const { weight, age, gender, height, name, notes = "" } = member;
  const genderText = gender === "male" ? "남성" : "여성";

  // 기본 정보 요약 - 텍스트 제거

  const exerciseEvaluations: ExerciseEvaluation[] = [];

  // 각 운동별 평가 수집
  if (measurementData.squatKg) {
    const evaluation = evaluateSquat(measurementData, weight, notes);
    // evaluation 텍스트 제거
    evaluation.evaluation = "";
    exerciseEvaluations.push(evaluation);
  }

  if (measurementData.benchKg) {
    const evaluation = evaluateBench(measurementData, weight);
    // evaluation 텍스트 제거
    evaluation.evaluation = "";
    exerciseEvaluations.push(evaluation);
  }

  if (measurementData.shoulderKg) {
    const evaluation = evaluateShoulder(measurementData, weight);
    // evaluation 텍스트 제거
    evaluation.evaluation = "";
    exerciseEvaluations.push(evaluation);
  }

  // 최종 종합 총평 - 텍스트 제거, 빈 문자열로 설정
  const summary = "";

  return {
    basicInfo: "", // 텍스트 코멘트 제거
    exerciseEvaluations,
    summary, // 텍스트 코멘트 제거
  };
}

// 헬퍼 함수들
function getStrengthLevel(avgRatio: number): string {
  if (avgRatio >= 1.2) return "우수한";
  if (avgRatio >= 0.9) return "중간 이상";
  if (avgRatio >= 0.7) return "기본";
  return "기본 이하";
}

function evaluateSquat(measurementData: any, weight: number, notes: string): ExerciseEvaluation {
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

  const evaluation = ""; // 텍스트 코멘트 제거

  return {
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
  };
}

function evaluateBench(measurementData: any, weight: number): ExerciseEvaluation {
  const ratio = measurementData.benchKg / weight;
  const ratioText = ratio.toFixed(2);
  let levelText = "";
  if (ratio >= 1.2) levelText = "평균 이상";
  else if (ratio >= 0.85) levelText = "평균 이하 ~ 평균 경계";
  else levelText = "평균 이하";

  const issues: string[] = [];
  if (measurementData.benchImbalance) issues.push("좌우 힘 차이 인지됨 → 안정성 문제");
  if (measurementData.benchShoulderDiscomfort) issues.push("어깨 불편감");
  if (measurementData.benchRangeLimit) issues.push("가동 범위 제한");
  if (measurementData.benchScapula) issues.push("견갑 고정 어려움");

  const evaluation = ""; // 텍스트 코멘트 제거

  return {
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
  };
}

function evaluateShoulder(measurementData: any, weight: number): ExerciseEvaluation {
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

  const evaluation = ""; // 텍스트 코멘트 제거

  return {
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
  };
}
