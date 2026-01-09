import { MeasurementResult, TotalSummary } from "@/lib/api";

// localStorage에 저장할 측정 결과 데이터 구조
export interface SavedMeasurement {
  memberId: string;
  measuredAt: string; // ISO 날짜 문자열
  results: MeasurementResult[];
  totalSummary?: TotalSummary;
  selectedExerciseTypes?: string[];
  member?: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    notes?: string;
  };
  measurementData?: any; // EvaluationModal에서 사용하는 원본 측정 데이터
}

