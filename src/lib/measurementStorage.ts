import { SavedMeasurement } from "@/types/measurement";

const STORAGE_KEY = "member_measurements";

/**
 * localStorage에서 모든 측정 이력 가져오기
 */
export const getAllSavedMeasurements = (): SavedMeasurement[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("측정 이력 불러오기 실패:", error);
    return [];
  }
};

/**
 * 특정 회원의 측정 이력 가져오기
 */
export const getSavedMeasurementsByMemberId = (memberId: string): SavedMeasurement[] => {
  const all = getAllSavedMeasurements();
  return all.filter((m) => m.memberId === memberId);
};

/**
 * 측정 결과 저장
 */
export const saveMeasurement = (measurement: SavedMeasurement): void => {
  if (typeof window === "undefined") return;
  
  try {
    const all = getAllSavedMeasurements();
    // 새로운 측정 결과를 배열 앞에 추가 (최신순)
    all.unshift(measurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("측정 결과 저장 실패:", error);
  }
};

/**
 * 특정 회원의 측정 이력 삭제
 */
export const deleteMeasurementsByMemberId = (memberId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const all = getAllSavedMeasurements();
    const filtered = all.filter((m) => m.memberId !== memberId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("측정 이력 삭제 실패:", error);
  }
};

/**
 * 특정 측정 결과 삭제 (memberId + measuredAt으로 식별)
 */
export const deleteMeasurement = (memberId: string, measuredAt: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const all = getAllSavedMeasurements();
    const filtered = all.filter(
      (m) => !(m.memberId === memberId && m.measuredAt === measuredAt)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("측정 결과 삭제 실패:", error);
  }
};

/**
 * 모든 측정 이력 삭제 (초기화)
 */
export const clearAllMeasurements = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("측정 이력 초기화 실패:", error);
  }
};

