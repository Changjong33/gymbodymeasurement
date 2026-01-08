import { EvaluationResult } from "@/lib/evaluationUtils";
import { MeasurementResult } from "@/lib/api";
import MeasurementRadarChart from "./MeasurementRadarChart";

interface EvaluationModalProps {
  evaluationResult: EvaluationResult;
  apiResults?: MeasurementResult[];
  onClose: () => void;
}

export default function EvaluationModal({
  evaluationResult,
  apiResults,
  onClose,
}: EvaluationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📊 측정 결과</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Radar Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <MeasurementRadarChart results={apiResults} />
          </div>

          {/* 운동 종목별 결과 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluationResult.exerciseEvaluations.map((exerciseEval, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{exerciseEval.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{exerciseEval.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {exerciseEval.unit === "reps" ? (
                          <>{exerciseEval.weightKg}회</>
                        ) : exerciseEval.unit === "level" ? (
                          <>Level: {exerciseEval.levelText}</>
                        ) : (
                          <>{exerciseEval.weightKg}kg</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 px-3 py-1.5 rounded-lg">
                      <div className="text-xs text-blue-600 font-medium mb-1">Level</div>
                      <div className="text-lg font-bold text-blue-800">
                        {exerciseEval.levelText || exerciseEval.level}
                      </div>
                      {exerciseEval.score > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Score: {exerciseEval.score}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {exerciseEval.unit !== "reps" && exerciseEval.unit !== "level" && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">체중 대비:</span> {exerciseEval.ratioText}배
                    </div>
                  </div>
                )}
                {exerciseEval.issues && exerciseEval.issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-red-600 mb-2">
                      문제점:
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {exerciseEval.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-2 rounded-md font-semibold hover:from-green-500 hover:to-green-700 transition"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

