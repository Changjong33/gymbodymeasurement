// 레벨 도달 기준표 생성 함수
export interface LevelStandard {
  level: string;
  score: number;
  value: number;
}

export interface ExerciseLevelStandards {
  exerciseName: string;
  unit: string;
  levels: LevelStandard[];
}

// 나이와 몸무게 기반 레벨 기준 계산
export function calculateLevelStandards(
  age: number,
  weight: number,
  gender: "male" | "female"
): ExerciseLevelStandards[] {
  const isMale = gender === "male";
  
  // 기준표 생성 함수
  const createStandards = (
    exerciseName: string,
    unit: string,
    baseValues: { [key: number]: number }
  ): ExerciseLevelStandards => {
    return {
      exerciseName,
      unit,
      levels: [
        { level: "입문자", score: 1, value: baseValues[1] },
        { level: "초급자", score: 2, value: baseValues[2] },
        { level: "중급자", score: 3, value: baseValues[3] },
        { level: "상급자", score: 4, value: baseValues[4] },
        { level: "엘리트", score: 5, value: baseValues[5] },
      ],
    };
  };

  // 나이 보정 계수 (나이가 많을수록 기준 낮춤)
  const ageFactor = age < 30 ? 1.0 : age < 40 ? 0.95 : age < 50 ? 0.9 : 0.85;
  
  // 성별 보정 계수
  const genderFactor = isMale ? 1.0 : 0.75;

  const standards: ExerciseLevelStandards[] = [];

  // 전신 - 버피
  standards.push(
    createStandards("전신 버피", "회", {
      1: Math.round(10 * ageFactor * genderFactor),
      2: Math.round(20 * ageFactor * genderFactor),
      3: Math.round(30 * ageFactor * genderFactor),
      4: Math.round(40 * ageFactor * genderFactor),
      5: Math.round(50 * ageFactor * genderFactor),
    })
  );

  // 가슴 - 푸쉬업
  standards.push(
    createStandards("가슴 푸쉬업", "회", {
      1: Math.round(5 * ageFactor * genderFactor),
      2: Math.round(15 * ageFactor * genderFactor),
      3: Math.round(25 * ageFactor * genderFactor),
      4: Math.round(35 * ageFactor * genderFactor),
      5: Math.round(45 * ageFactor * genderFactor),
    })
  );

  // 하체 - 스쿼트
  standards.push(
    createStandards("하체 스쿼트", "회", {
      1: Math.round(15 * ageFactor * genderFactor),
      2: Math.round(25 * ageFactor * genderFactor),
      3: Math.round(35 * ageFactor * genderFactor),
      4: Math.round(45 * ageFactor * genderFactor),
      5: Math.round(55 * ageFactor * genderFactor),
    })
  );

  // 등 - 풀업
  standards.push(
    createStandards("등 풀업", "회", {
      1: Math.round(1 * ageFactor * genderFactor),
      2: Math.round(3 * ageFactor * genderFactor),
      3: Math.round(5 * ageFactor * genderFactor),
      4: Math.round(8 * ageFactor * genderFactor),
      5: Math.round(12 * ageFactor * genderFactor),
    })
  );

  // 코어 - 윗몸일으키기
  standards.push(
    createStandards("코어 윗몸일으키기", "회", {
      1: Math.round(10 * ageFactor * genderFactor),
      2: Math.round(20 * ageFactor * genderFactor),
      3: Math.round(30 * ageFactor * genderFactor),
      4: Math.round(40 * ageFactor * genderFactor),
      5: Math.round(50 * ageFactor * genderFactor),
    })
  );

  return standards;
}

