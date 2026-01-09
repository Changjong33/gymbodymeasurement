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
export function collectIssuesByCategory(categoryId: number, measurementData: any, notes: string): string[] {
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
