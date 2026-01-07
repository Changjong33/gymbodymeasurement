// 운동 타입 정의
export type ExerciseType = "flexibility" | "bodyweight" | "weight";

// 공통 섹션 타입
export type BaseSection = {
  title: string;
  prefix: string;
  kgField: string;
  category: ExerciseType;
};

