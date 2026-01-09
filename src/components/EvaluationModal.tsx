import { EvaluationResult } from "@/lib/evaluationUtils";
import { MeasurementResult } from "@/lib/api";
import MeasurementRadarChart from "./MeasurementRadarChart";
import { calculateLevelStandards } from "@/lib/levelStandards";

interface EvaluationModalProps {
  evaluationResult: EvaluationResult;
  apiResults?: MeasurementResult[];
  selectedExerciseTypes?: string[];
  member?: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
  };
  onClose: () => void;
}

export default function EvaluationModal({ evaluationResult, apiResults, selectedExerciseTypes = [], member, onClose }: EvaluationModalProps) {
  // 운동 타입별 categoryId 매핑
  const getCategoryIdsByType = (exerciseType: string): number[] => {
    const typeMap: Record<string, number[]> = {
      weight: [1, 3, 4, 6, 7], // 웨이트 트레이닝
      bodyweight: [2, 5, 8, 9, 10], // 맨몸 운동
      flexibility: [11, 12, 13, 14, 15], // 유연성/유연성
      aerobic: [11, 12, 13, 14, 15], // 유연성/유연성
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

  // 선택한 운동 타입별로 결과 필터링
  const getChartDataByType = (exerciseType: string): MeasurementResult[] => {
    if (!apiResults || apiResults.length === 0) return [];
    const categoryIds = getCategoryIdsByType(exerciseType);
    return apiResults.filter((result) => categoryIds.includes(result.categoryId));
  };
  const genderText = member?.gender === "male" ? "남성" : member?.gender === "female" ? "여성" : "";

  // 유연성이 아닌 종목들만 필터링
  const exerciseCards = evaluationResult.exerciseEvaluations.filter((exerciseEval) => exerciseEval.unit !== "level");

  // 레벨 기준표 생성
  const levelStandards = member ? calculateLevelStandards(member.age, member.weight, member.gender as "male" | "female") : [];

  // 모든 문제점 수집 (종합 총평 제거, 문제점만 표시)
  const allIssues: Array<{ exerciseName: string; issues: string[] }> = [];
  exerciseCards.forEach((exerciseEval) => {
    if (exerciseEval.issues && exerciseEval.issues.length > 0) {
      allIssues.push({
        exerciseName: exerciseEval.name,
        issues: exerciseEval.issues,
      });
    }
  });

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
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* 상단 영역: 차트 2개 + 회원 정보 */}
          <div className="flex-shrink-0 grid grid-cols-12 gap-4 mb-4" style={{ height: "420px" }}>
            {/* 좌측: 차트 영역 (2개 차트 가로 배치) */}
            <div className="col-span-8 flex gap-4 h-120">
              {selectedExerciseTypes.length > 0 ? (
                selectedExerciseTypes.map((exerciseType) => {
                  const chartResults = getChartDataByType(exerciseType);
                  if (chartResults.length === 0) return null;
                  return (
                    <div key={exerciseType} className=" flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
                      <MeasurementRadarChart results={chartResults} title={getChartTitle(exerciseType)} showDataLabels={true} exerciseType={exerciseType} />
                    </div>
                  );
                })
              ) : (
                <div className=" flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
                  <MeasurementRadarChart results={apiResults} title="신체 부위별 운동 능력 차트" showDataLabels={true} />
                </div>
              )}
            </div>

            {/* 우측: 회원 정보 카드 */}
            {member && (
              <div className="col-span-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 flex flex-col" style={{ height: "210px" }}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">회원 정보</h3>
                <div className="flex-1 grid grid-cols-2 ">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">이름</div>
                    <div className="text-lg font-semibold text-gray-800">{member.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">성별</div>
                    <div className="text-base font-semibold text-gray-800">{genderText}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">나이</div>
                      <div className="text-base font-semibold text-gray-800">{member.age}세</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">몸무게</div>
                    <div className="text-base font-semibold text-gray-800">{member.weight}kg</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 영역: 레벨 도달 기준표 + 문제점 */}
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
            {/* 좌측: 레벨 도달 기준표 */}
            <div className="col-span-8 bg-white border border-gray-200 rounded-lg p-4 overflow-hidden flex flex-col h-[298px]">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800 mb-3">레벨 도달 기준표</h3>
                {member && (
                  <div className="text-xs text-gray-600 mb-3">
                    기준: {member.age}세, {member.weight}kg ({genderText})
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto h-42">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">종목</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">입문자</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">초급자</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">중급자</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">상급자</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">엘리트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelStandards.map((standard, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{standard.exerciseName}</td>
                          {standard.levels.map((level, levelIndex) => (
                            <td key={levelIndex} className="px-3 py-2 text-center text-gray-700">
                              {level.value}
                              {standard.unit === "회" ? "회" : standard.unit === "kg" ? "kg" : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 우측: 문제점 표시 영역 */}
            <div className="col-span-4 bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col h-[298px]">
              <h3 className="text-lg font-bold text-gray-800 mb-3">관찰된 문제점</h3>
              <div className="flex-1 overflow-y-auto">
                {allIssues.length > 0 ? (
                  <div className="space-y-3 grid grid-cols-2 gap-2">
                    {allIssues.map((item, index) => (
                      <div key={index} className="border-b border-gray-200 pb-2 last:border-0">
                        <div className="text-sm font-semibold text-gray-700 mb-1">{item.exerciseName}</div>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                          {item.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">관찰된 문제점이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
