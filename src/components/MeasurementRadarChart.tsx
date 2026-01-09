"use client";

import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import { MeasurementResult } from "@/lib/api";

// Chart.js 등록
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MeasurementRadarChartProps {
  results?: MeasurementResult[];
  title?: string;
  showDataLabels?: boolean;
  exerciseType?: string; // "weight" | "bodyweight" | "flexibility"
}

// categoryId → 차트 라벨 매핑 (분리된 매핑 객체)
const CATEGORY_ID_TO_LABEL: Record<number, string> = {
  1: "가슴", // 벤치프레스
  2: "등", // 풀업
  3: "어깨", // 숄더프레스
  4: "하체", // 바벨 스쿼트
  5: "코어", // 윗몸일으키기
  6: "등", // 바벨 로우
  7: "전신", // 데드리프트
  8: "가슴", // 푸쉬업
  9: "하체", // 스쿼트
  10: "전신", // 버피
  11: "흉추", // 흉추 가동성
  12: "어깨", // 어깨 유연성
  13: "햄스트링", // 햄스트링
  14: "고관절", // 고관절
  15: "발목", // 발목 가동성
};

// API 결과 → Radar Chart 데이터로 변환 (간소화된 버전)
// results 배열을 그대로 사용하여 차트 생성
const convertResultsToRadarData = (results?: MeasurementResult[]) => {
  if (!results || results.length === 0) {
    return { labels: [], data: [], exerciseData: [] };
  }

  // results 배열을 그대로 사용 (results.length에 따라 자동 렌더링)
  const labels = results.map((result) => CATEGORY_ID_TO_LABEL[result.categoryId] || result.exerciseName);
  const data = results.map((result) => result.score); // score 값만 사용 (1~5)
  const exerciseData = results.map((result) => ({
    categoryId: result.categoryId,
    exerciseName: result.exerciseName,
    value: result.value,
    unit: result.unit,
  }));

  return { labels, data, exerciseData };
};

export default function MeasurementRadarChart({ results, title, showDataLabels = true, exerciseType }: MeasurementRadarChartProps) {
  const { labels, data, exerciseData } = convertResultsToRadarData(results);

  const chartData = {
    labels,
    datasets: [
      {
        label: title || "신체 부위별 운동 능력",
        data,
        backgroundColor: "rgba(34, 197, 94, 0.2)", // green-500 with opacity
        borderColor: "rgba(34, 197, 94, 1)", // green-500
        borderWidth: 2,
        pointBackgroundColor: "rgba(34, 197, 94, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(34, 197, 94, 1)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
          },
        },
        pointLabels: {
          font: {
            size: 11,
            weight: "bold" as const,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed.r.toFixed(2)}점`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg">
      {title && <h3 className="text-sm font-semibold text-gray-800 mb-2 text-center">{title}</h3>}
      <div className="flex-1 relative w-full min-h-0">
        <Radar data={chartData} options={chartOptions} />
      </div>
      {/* 차트 하단: 운동명과 수치 표시 */}
      {showDataLabels && exerciseData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className={`grid gap-2 text-xs ${exerciseData.length <= 5 ? "grid-cols-5" : exerciseData.length <= 10 ? "grid-cols-5" : "grid-cols-6"}`}>
            {exerciseData.map((item, index) => {
              const unitText = item.unit === "reps" ? "회" : item.unit === "kg" ? "kg" : "";
              return (
                <div key={`${item.categoryId}-${index}`} className="text-center">
                  <div className="font-medium text-gray-700">{item.exerciseName}</div>
                  <div className="text-gray-600">
                    {item.value}
                    {unitText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
