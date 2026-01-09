import { useMemo } from "react";
import { MeasurementResult } from "@/lib/api";
import MeasurementRadarChart from "./MeasurementRadarChart";
import { collectIssuesByCategory } from "@/lib/evaluationUtils";

interface EvaluationModalProps {
  results?: MeasurementResult[];
  selectedExerciseTypes?: string[];
  member?: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    notes?: string;
  };
  measurementData?: any;
  onClose: () => void;
}

// 레벨 기준표 행 데이터 타입
interface LevelStandardRow {
  categoryId: number;
  exerciseName: string;
  unit: string;
  beginner: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

// 운동 타입별 categoryId 매핑
const getCategoryIdsByType = (exerciseType: string): number[] => {
  const typeMap: Record<string, number[]> = {
    weight: [1, 3, 4, 6, 7], // 웨이트 트레이닝
    bodyweight: [2, 5, 8, 9, 10], // 맨몸 운동
    flexibility: [11, 12, 13, 14, 15], // 유연성
    aerobic: [11, 12, 13, 14, 15], // 유연성
  };
  return typeMap[exerciseType] || [];
};

// 운동 타입에 따른 차트 제목
const getChartTitle = (exerciseType: string): string => {
  const typeMap: Record<string, string> = {
    weight: "웨이트 트레이닝",
    bodyweight: "맨몸 운동",
    flexibility: "유연성",
    aerobic: "유연성",
  };
  return typeMap[exerciseType] || exerciseType;
};

export default function EvaluationModal({ results = [], selectedExerciseTypes = [], member, measurementData, onClose }: EvaluationModalProps) {
  const genderText = member?.gender === "male" ? "남성" : member?.gender === "female" ? "여성" : "";

  // 선택한 운동 타입별로 결과 필터링
  const getChartDataByType = (exerciseType: string): MeasurementResult[] => {
    if (!results || results.length === 0) return [];
    const categoryIds = getCategoryIdsByType(exerciseType);
    return results.filter((result) => categoryIds.includes(result.categoryId));
  };

  // adjustedLevels를 사용하여 레벨 기준표 생성 (유연성 제외)
  const levelStandards = useMemo((): LevelStandardRow[] => {
    if (!results || results.length === 0) return [];

    return results
      .filter((result) => {
        // 유연성(categoryId 11-15)은 레벨 기준표에서 제외
        return result.categoryId < 11 || result.categoryId > 15;
      })
      .map((result) => {
        const levels = result.adjustedLevels;

        if (!levels) {
          console.warn("adjustedLevels 없음:", result);
          return null;
        }

        // categoryId에 따라 unit 강제 설정
        let unit = "";
        // 맨몸운동 (2, 5, 8, 9, 10)은 모두 "회"
        if ([2, 5, 8, 9, 10].includes(result.categoryId)) {
          unit = "회";
        }
        // 웨이트 트레이닝 (1, 3, 4, 6, 7)은 모두 "kg"
        else if ([1, 3, 4, 6, 7].includes(result.categoryId)) {
          unit = "kg";
        }
        // 기타는 원래 unit 사용
        else {
          unit = result.unit === "reps" ? "회" : result.unit === "kg" ? "kg" : result.unit ?? "";
        }

        return {
          categoryId: result.categoryId,
          exerciseName: result.exerciseName ?? "",
          unit,
          beginner: levels.beginner ?? 0,
          novice: levels.novice ?? 0,
          intermediate: levels.intermediate ?? 0,
          advanced: levels.advanced ?? 0,
          elite: levels.elite ?? 0,
        };
      })
      .filter(Boolean) as LevelStandardRow[];
  }, [results]);

  // 문제점 수집 (유연성 제외)
  const allIssues = useMemo(() => {
    if (!results || !measurementData) return [];
    const issues: Array<{ exerciseName: string; issues: string[] }> = [];
    const notes = member?.notes || "";

    results
      .filter((result) => {
        // 유연성(categoryId 11-15)은 문제점에서 제외
        return result.categoryId < 11 || result.categoryId > 15;
      })
      .forEach((result) => {
        const exerciseIssues = collectIssuesByCategory(result.categoryId, measurementData, notes);
        if (exerciseIssues.length > 0) {
          issues.push({
            exerciseName: result.exerciseName,
            issues: exerciseIssues,
          });
        }
      });

    return issues;
  }, [results, measurementData, member?.notes]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 - 고정 */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📊 측정 결과</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>

        {/* 메인 콘텐츠 - 스크롤 없이 고정 높이 */}
        <div className="flex-1 p-6 overflow-hidden flex gap-4">
          {/* 좌측 영역: 차트와 레벨 기준표 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 상단 영역: 차트 */}
            <div className="flex-shrink-0 mb-4" style={{ height: "420px" }}>
              {selectedExerciseTypes.length > 0 ? (
                <div
                  className="grid gap-4 h-full"
                  style={{
                    gridTemplateColumns: `repeat(${selectedExerciseTypes.length}, 1fr)`,
                  }}
                >
                  {selectedExerciseTypes.map((exerciseType) => {
                    const chartResults = getChartDataByType(exerciseType);
                    if (chartResults.length === 0) return null;
                    return (
                      <div key={exerciseType} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col min-w-0">
                        <MeasurementRadarChart results={chartResults} title={getChartTitle(exerciseType)} showDataLabels={true} exerciseType={exerciseType} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col h-full">
                    <MeasurementRadarChart results={results} title="신체 부위별 운동 능력 차트" showDataLabels={true} />
                  </div>
                </div>
              )}
            </div>

            {/* 하단 영역: 레벨 도달 기준표 */}
            <div className="flex-1 min-h-0">
              <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-hidden flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-800">레벨 도달 기준표</h3>
                  {member && (
                    <div className="text-xs text-gray-600">
                      기준: {genderText}, {member.age}세, {member.weight}kg
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-300 sticky top-0">
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">종목</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">입문자</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">초급자</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">중급자</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">상급자</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">엘리트</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelStandards.length > 0 ? (
                          levelStandards.map((standard) => (
                            <tr key={standard.categoryId} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800">{standard.exerciseName}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{standard.beginner > 0 ? `${Math.floor(standard.beginner)}${standard.unit}` : "-"}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{standard.novice > 0 ? `${Math.floor(standard.novice)}${standard.unit}` : "-"}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{standard.intermediate > 0 ? `${Math.floor(standard.intermediate)}${standard.unit}` : "-"}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{standard.advanced > 0 ? `${Math.floor(standard.advanced)}${standard.unit}` : "-"}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{standard.elite > 0 ? `${Math.floor(standard.elite)}${standard.unit}` : "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                              레벨 기준표 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 영역: 회원정보와 문제점 */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            {/* 회원정보 카드 */}
            {member && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">👤 회원정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이름</span>
                    <span className="font-medium text-gray-800">{member.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">성별</span>
                    <span className="font-medium text-gray-800">{genderText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">나이</span>
                    <span className="font-medium text-gray-800">{member.age}세</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">키</span>
                    <span className="font-medium text-gray-800">{member.height}cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">몸무게</span>
                    <span className="font-medium text-gray-800">{member.weight}kg</span>
                  </div>
                  {member.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-gray-600 mb-1">특이사항</div>
                      <div className="text-sm text-gray-700">{member.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 문제점 카드 */}
            {allIssues.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 min-h-0 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ 발견된 문제점</h3>
                <div className="flex-1 overflow-auto space-y-4">
                  {allIssues.map((item, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="font-semibold text-gray-800 mb-2">{item.exerciseName}</div>
                      <ul className="space-y-1">
                        {item.issues.map((issue, issueIndex) => (
                          <li key={issueIndex} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {allIssues.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 min-h-0 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ 발견된 문제점</h3>
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">발견된 문제점이 없습니다.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
