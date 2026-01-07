import { CalculateMeasurementsResponse, MeasurementResult } from "./api";

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

// Score를 레벨명으로 변환
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
      return "평가 없음";
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
  }

  return issues;
}

// 문제점 기반 평가 텍스트 생성
function generateEvaluationText(
  categoryId: number,
  exerciseName: string,
  levelName: string,
  issues: string[],
  measurementData: any
): string {
  if (issues.length === 0) {
    return `${exerciseName.split("–")[0].trim()} 근력은 ${levelName} 수준으로 평가됩니다.`;
  }

  let evaluation = `${exerciseName.split("–")[0].trim()} 근력은 ${levelName} 수준이나,\n`;

  if (categoryId === 4 && measurementData.squatDepth) {
    evaluation += `가동범위 제한으로 실제 활용 가능한 근력은 낮아져 있는 상태입니다.`;
  } else if (categoryId === 1 && measurementData.benchImbalance) {
    evaluation += `좌우 밸런스 불균형으로 중량 상승에 제약이 있습니다.`;
  } else if (categoryId === 2 && measurementData.pullupArms) {
    evaluation += `등 근육이 아닌 팔에 힘이 집중되는 패턴이 나타납니다.`;
  } else {
    evaluation += `${issues[0]} 등의 문제가 관찰됩니다.`;
  }

  return evaluation;
}

// API 응답을 기반으로 총평 생성
export function generateEvaluationFromApiResponse(
  member: any,
  apiResponse: CalculateMeasurementsResponse,
  measurementData: any
): EvaluationResult {
  const { weight, age, gender, height, name, notes = "" } = member;
  const genderText = gender === "male" ? "남성" : "여성";

  // 기본 정보 요약
  const overallLevel = apiResponse.data.totalSummary.overallLevel;
  const overallLevelName = getLevelName(apiResponse.data.totalSummary.averageScore);
  
  let basicInfo = `${name} 회원님은\n${age}세 / ${genderText} / ${height}cm / ${weight}kg 체형으로\n`;
  basicInfo += `체중 대비 전신 근력은 ${overallLevelName} 수준(${overallLevel})으로 평가됩니다.`;

  if (notes) {
    basicInfo += `\n다만 ${notes} 부상 이력이 있어 해당 부위 동작의 깊이와 안정성에서 제한이 관찰됩니다.`;
  }

  const exerciseEvaluations: ExerciseEvaluation[] = [];
  const allIssues: string[] = [];

  // 운동별 매핑 정보
  const exerciseMap: { [key: number]: { name: string; emoji: string } } = {
    1: { name: "가슴 – 벤치프레스", emoji: "💪" },
    2: { name: "등 – 풀업", emoji: "🧲" },
    3: { name: "어깨 – 숄더프레스", emoji: "🏋️" },
    4: { name: "하체 – 바벨 스쿼트", emoji: "🦵" },
    5: { name: "코어 – 윗몸일으키기", emoji: "💪" },
  };

  // API 결과를 기반으로 평가 생성
  apiResponse.data.results.forEach((result: MeasurementResult) => {
    const exerciseInfo = exerciseMap[result.categoryId];
    if (!exerciseInfo) return;

    const issues = collectIssuesByCategory(result.categoryId, measurementData, notes);
    const levelName = getLevelName(result.score);
    const ratio = weight > 0 ? result.value / weight : 0;
    const ratioText = ratio.toFixed(2);

    const evaluation = generateEvaluationText(
      result.categoryId,
      exerciseInfo.name,
      levelName,
      issues,
      measurementData
    );

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

// 기존 방식의 총평 생성 (하위 호환성)
export function generateEvaluation(member: any, measurementData: any): EvaluationResult {
  const { weight, age, gender, height, name, notes = "" } = member;
  const genderText = gender === "male" ? "남성" : "여성";

  // 기본 정보 요약
  let basicInfo = `${name} 회원님은\n${age}세 / ${genderText} / ${height}cm / ${weight}kg 체형으로\n`;

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
  if (measurementData.shoulderKg) {
    totalStrength += measurementData.shoulderKg / weight;
    exerciseCount++;
  }

  const avgRatio = exerciseCount > 0 ? totalStrength / exerciseCount : 0;
  const strengthLevel = getStrengthLevel(avgRatio);

  basicInfo += `체중 대비 전신 근력은 ${strengthLevel} 수준으로 평가됩니다.`;

  if (notes) {
    basicInfo += `\n다만 ${notes} 부상 이력이 있어 해당 부위 동작의 깊이와 안정성에서 제한이 관찰됩니다.`;
  }

  const exerciseEvaluations: ExerciseEvaluation[] = [];
  const allIssues: string[] = [];

  // 각 운동별 평가 수집
  if (measurementData.squatKg) {
    const evaluation = evaluateSquat(measurementData, weight, notes);
    exerciseEvaluations.push(evaluation);
    allIssues.push(...evaluation.issues.map((issue) => `하체: ${issue}`));
  }

  if (measurementData.benchKg) {
    const evaluation = evaluateBench(measurementData, weight);
    exerciseEvaluations.push(evaluation);
    allIssues.push(...evaluation.issues.map((issue) => `가슴: ${issue}`));
  }

  if (measurementData.shoulderKg) {
    const evaluation = evaluateShoulder(measurementData, weight);
    exerciseEvaluations.push(evaluation);
    allIssues.push(...evaluation.issues.map((issue) => `어깨: ${issue}`));
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

  let evaluation = "";
  if (issues.length > 0) {
    evaluation = `하체 근력 자체는 ${levelText}이나,\n가동범위 제한으로 실제 활용 가능한 근력은 낮아져 있는 상태입니다.`;
  } else {
    evaluation = `하체 근력은 ${levelText} 수준으로 평가됩니다.`;
  }

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

  let evaluation = "";
  if (measurementData.benchImbalance) {
    evaluation = `가슴 근력은 기본은 확보되어 있으나,\n좌우 밸런스 불균형으로 중량 상승에 제약이 있습니다.`;
  } else {
    evaluation = `가슴 근력은 ${levelText} 수준으로 평가됩니다.`;
  }

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

  let evaluation = "";
  if (ratio < 0.5) {
    evaluation = `상체 프레스 계열 중 어깨 근력이 상대적으로 약해\n상체 전반의 안정성 보완이 필요한 상태입니다.`;
  } else {
    evaluation = `어깨 근력은 ${levelText} 수준으로 평가됩니다.`;
    if (issues.length > 0) {
      evaluation += `\n다만 ${issues[0]} 등의 문제가 관찰됩니다.`;
    }
  }

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

