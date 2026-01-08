import { EvaluationResult } from "@/lib/evaluationUtils";
import { MeasurementResult } from "@/lib/api";
import MeasurementRadarChart from "./MeasurementRadarChart";

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
      flexibility: [11, 12, 13, 14, 15], // 유산소/유연성
      aerobic: [11, 12, 13, 14, 15], // 유산소/유연성
    };
    return typeMap[exerciseType] || [];
  };

  // 운동 타입에 따른 차트 제목
  const getChartTitle = (exerciseType: string): string => {
    const typeMap: Record<string, string> = {
      weight: "웨이트 트레이닝",
      bodyweight: "맨몸 운동",
      flexibility: "유산소",
      aerobic: "유산소",
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

  // 유산소가 아닌 종목들만 필터링
  const exerciseCards = evaluationResult.exerciseEvaluations.filter((exerciseEval) => exerciseEval.unit !== "level");

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
            <div className="col-span-8 flex gap-4">
              {selectedExerciseTypes.length > 0 ? (
                selectedExerciseTypes.map((exerciseType) => {
                  const chartResults = getChartDataByType(exerciseType);
                  if (chartResults.length === 0) return null;
                  return (
                    <div key={exerciseType} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
                      <MeasurementRadarChart results={chartResults} title={getChartTitle(exerciseType)} />
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
                  <MeasurementRadarChart results={apiResults} title="신체 부위별 운동 능력 차트" />
                </div>
              )}
            </div>

            {/* 우측: 회원 정보 카드 */}
            {member && (
              <div className="col-span-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">회원 정보</h3>
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">이름</div>
                    <div className="text-lg font-semibold text-gray-800">{member.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">나이</div>
                      <div className="text-base font-semibold text-gray-800">{member.age}세</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">성별</div>
                      <div className="text-base font-semibold text-gray-800">{genderText}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">키</div>
                      <div className="text-base font-semibold text-gray-800">{member.height}cm</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">몸무게</div>
                      <div className="text-base font-semibold text-gray-800">{member.weight}kg</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-2 px-4 rounded-md font-semibold hover:from-green-500 hover:to-green-700 transition"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 하단 영역: 종목별 결과 카드 가로 배치 */}
          <div className="flex-1 min-h-0">
            <div className="h-full overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>
                {exerciseCards.map((exerciseEval, index) => (
                  <div key={index} className="flex-shrink-0 w-80 bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{exerciseEval.emoji}</span>
                        <div>
                          <h3 className="font-bold text-base text-gray-800 leading-tight">{exerciseEval.name}</h3>
                          <div className="text-xs text-gray-600 mt-0.5">{exerciseEval.unit === "reps" ? <>{exerciseEval.weightKg}회</> : <>{exerciseEval.weightKg}kg</>}</div>
                        </div>
                      </div>
                      <div className="bg-blue-100 px-2 py-1.5 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium mb-0.5">Level</div>
                        <div className="text-sm font-bold text-blue-800">{exerciseEval.levelText || exerciseEval.level}</div>
                        {exerciseEval.score > 0 && <div className="text-xs text-blue-600 mt-0.5">Score: {exerciseEval.score}</div>}
                      </div>
                    </div>
                    {exerciseEval.unit !== "reps" && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">체중 대비:</span> {exerciseEval.ratioText}배
                        </div>
                      </div>
                    )}
                    {exerciseEval.issues && exerciseEval.issues.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 flex-1 flex flex-col min-h-0">
                        <div className="text-xs font-medium text-red-600 mb-1">문제점:</div>
                        <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5 overflow-y-auto">
                          {exerciseEval.issues.map((issue, i) => (
                            <li key={i} className="leading-tight">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
