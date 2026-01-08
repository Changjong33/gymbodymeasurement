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
          <h2 className="text-2xl font-bold text-gray-800">📋 측정 결과 총평</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">기본 정보</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {evaluationResult.basicInfo}
            </p>
          </div>

          {/* Radar Chart */}
          {apiResults && apiResults.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <MeasurementRadarChart results={apiResults} />
            </div>
          )}

          {/* 부위별 총평 */}
          {evaluationResult.exerciseEvaluations.map((exerciseEval, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{exerciseEval.emoji}</span>
                <h3 className="font-semibold text-lg text-gray-800">
                  {exerciseEval.name} ({exerciseEval.unit === "reps" ? "횟수" : "1RM"}{" "}
                  {exerciseEval.weightKg}
                  {exerciseEval.unit === "reps" ? "회" : "kg"})
                </h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-blue-100 px-3 py-1 rounded-md">
                    <span className="text-sm font-semibold text-blue-800">
                      레벨: {exerciseEval.levelText || exerciseEval.level} (Score:{" "}
                      {exerciseEval.score})
                    </span>
                  </div>
                  {exerciseEval.nextLevelTarget > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">다음 레벨 목표:</span>{" "}
                      {exerciseEval.nextLevelTarget.toFixed(2)}
                      {exerciseEval.name.includes("윗몸") ? "회" : "kg"}
                      {exerciseEval.remaining > 0 && (
                        <span className="ml-2 text-orange-600">
                          (부족: {exerciseEval.remaining.toFixed(2)}
                          {exerciseEval.name.includes("윗몸") ? "회" : "kg"})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {exerciseEval.unit !== "reps" && (
                  <div className="text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">체중 대비 비율:</span>{" "}
                      {exerciseEval.ratioText}배
                    </div>
                  </div>
                )}
                {exerciseEval.issues.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-red-600 mb-1">
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
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-gray-700 whitespace-pre-line">
                  {exerciseEval.evaluation}
                </p>
              </div>
            </div>
          ))}

          {/* 최종 종합 총평 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-xl text-gray-800 mb-3">📊 종합 총평</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {evaluationResult.summary}
            </p>
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

