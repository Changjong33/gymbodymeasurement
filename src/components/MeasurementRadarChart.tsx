"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { MeasurementResult } from "@/lib/api";

// Chart.js 등록
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MeasurementRadarChartProps {
  results: MeasurementResult[];
}

// categoryId → 부위 매핑
const categoryIdToBodyPart = (categoryId: number): string | null => {
  const mapping: Record<number, string> = {
    1: "가슴", // 벤치프레스
    2: "등", // 풀업
    3: "어깨", // 숄더프레스
    4: "하체", // 바벨 스쿼트
    5: "전신", // 윗몸일으키기
    6: "등", // 바벨 로우
    7: "전신", // 데드리프트
    8: "가슴", // 푸쉬업
    9: "하체", // 스쿼트
    10: "전신", // 버피
  };
  return mapping[categoryId] || null;
};

// API 결과 → Radar Chart 데이터로 변환
const convertResultsToRadarData = (results: MeasurementResult[]) => {
  // 부위별 점수 그룹화
  const bodyPartScores: Record<string, number[]> = {
    전신: [],
    하체: [],
    어깨: [],
    등: [],
    가슴: [],
  };

  // 각 결과를 부위별로 분류
  results.forEach((result) => {
    const bodyPart = categoryIdToBodyPart(result.categoryId);
    if (bodyPart && bodyPartScores.hasOwnProperty(bodyPart)) {
      // 백엔드에서 내려온 score 값만 사용
      bodyPartScores[bodyPart].push(result.score);
    }
  });

  // 부위별 평균 계산 (측정되지 않은 부위는 0)
  const labels = ["전신", "하체", "어깨", "등", "가슴"];
  const data = labels.map((bodyPart) => {
    const scores = bodyPartScores[bodyPart];
    if (scores.length === 0) return 0; // 측정되지 않은 부위는 0
    // 평균 계산
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  });

  return { labels, data };
};

export default function MeasurementRadarChart({ results }: MeasurementRadarChartProps) {
  const { labels, data } = convertResultsToRadarData(results);

  const chartData = {
    labels,
    datasets: [
      {
        label: "신체 부위별 운동 능력",
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
    maintainAspectRatio: true,
    aspectRatio: 1,
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
          },
        },
        pointLabels: {
          font: {
            size: 14,
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
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">신체 부위별 운동 능력 차트</h3>
      <div className="relative w-full" style={{ height: "400px" }}>
        <Radar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

