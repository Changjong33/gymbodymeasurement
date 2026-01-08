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

// 임시 mock 데이터 (백엔드 API 없이도 차트 렌더링용)
const MOCK_RADAR_DATA = {
  전신: 4,
  하체: 3,
  어깨: 5,
  등: 4,
  가슴: 4,
};

// categoryId → 부위 매핑 (운동 타입별)
const categoryIdToBodyPart = (categoryId: number, exerciseType?: string): string | null => {
  // 유연성
  if (exerciseType === "flexibility" || exerciseType === "aerobic") {
    const flexibilityMapping: Record<number, string> = {
      11: "흉추", // 유연성 – 흉추 가동성
      12: "어깨", // 유연성 – 어깨 유연성
      13: "햄스트링", // 유연성 – 햄스트링
      14: "고관절", // 유연성 – 고관절
      15: "발목", // 유연성 – 발목 가동성
    };
    return flexibilityMapping[categoryId] || null;
  }

  // 맨몸 운동
  if (exerciseType === "bodyweight") {
    const bodyweightMapping: Record<number, string> = {
      10: "전신", // 버피
      5: "코어", // 윗몸일으키기
      8: "가슴", // 푸쉬업
      2: "등", // 풀업
      9: "하체", // 스쿼트
    };
    return bodyweightMapping[categoryId] || null;
  }

  // 웨이트 트레이닝
  if (exerciseType === "weight") {
    const weightMapping: Record<number, string> = {
      7: "전신", // 데드리프트
      3: "어깨", // 숄더프레스
      1: "가슴", // 벤치프레스
      6: "등", // 바벨 로우
      4: "하체", // 바벨 스쿼트
    };
    return weightMapping[categoryId] || null;
  }

  // 기본 매핑 (타입이 없을 때)
  const defaultMapping: Record<number, string> = {
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
    11: "흉추", // 유연성 – 흉추 가동성
    12: "어깨", // 유연성 – 어깨 유연성
    13: "햄스트링", // 유연성 – 햄스트링
    14: "고관절", // 유연성 – 고관절
    15: "발목", // 유연성 – 발목 가동성
  };
  return defaultMapping[categoryId] || null;
};

// categoryId → 운동 이름 매핑
const categoryIdToExerciseName = (categoryId: number): string | null => {
  const mapping: Record<number, string> = {
    1: "벤치프레스",
    2: "풀업",
    3: "숄더프레스",
    4: "바벨 스쿼트",
    5: "윗몸일으키기",
    6: "바벨 로우",
    7: "데드리프트",
    8: "푸쉬업",
    9: "스쿼트",
    10: "버피",
    11: "흉추 가동성",
    12: "어깨 유연성",
    13: "햄스트링",
    14: "고관절",
    15: "발목 가동성",
  };
  return mapping[categoryId] || null;
};

// 운동 타입별 labels 정의
const getLabelsByExerciseType = (exerciseType?: string): string[] => {
  if (exerciseType === "flexibility" || exerciseType === "aerobic") {
    return ["흉추", "어깨", "햄스트링", "고관절", "발목"];
  }
  if (exerciseType === "bodyweight") {
    return ["전신", "코어", "가슴", "등", "하체"];
  }
  if (exerciseType === "weight") {
    return ["전신", "어깨", "가슴", "등", "하체"];
  }
  // 기본값
  return ["전신", "하체", "어깨", "등", "가슴", "코어"];
};

// API 결과 → Radar Chart 데이터로 변환
const convertResultsToRadarData = (results?: MeasurementResult[], exerciseType?: string) => {
  const labels = getLabelsByExerciseType(exerciseType);

  // results가 없거나 비어있으면 mock 데이터 사용
  if (!results || results.length === 0) {
    const data = labels.map(() => 0);
    return { labels, data, bodyPartData: {} };
  }

  // 부위별 점수 및 실제 데이터 그룹화 (동적으로 생성)
  const bodyPartScores: Record<string, number[]> = {};
  const bodyPartData: Record<string, { exerciseName: string; value: number; unit: string }> = {};

  // labels에 따라 초기화
  labels.forEach((label) => {
    bodyPartScores[label] = [];
    bodyPartData[label] = { exerciseName: "", value: 0, unit: "" };
  });

  // 우선순위: 각 부위별로 대표 운동 선택 (운동 타입별)
  const getPriorityMap = (exerciseType?: string): Record<string, number[]> => {
    if (exerciseType === "flexibility" || exerciseType === "aerobic") {
      return {
        흉추: [11],
        어깨: [12],
        햄스트링: [13],
        고관절: [14],
        발목: [15],
      };
    }
    if (exerciseType === "bodyweight") {
      return {
        전신: [10], // 버피
        코어: [5], // 윗몸일으키기
        가슴: [8], // 푸쉬업
        등: [2], // 풀업
        하체: [9], // 스쿼트
      };
    }
    if (exerciseType === "weight") {
      return {
        전신: [7], // 데드리프트
        어깨: [3], // 숄더프레스
        가슴: [1], // 벤치프레스
        등: [6], // 바벨 로우
        하체: [4], // 바벨 스쿼트
      };
    }
    // 기본
    return {
      전신: [10, 7, 5],
      가슴: [8, 1],
      하체: [9, 4],
      등: [2, 6],
      코어: [5],
      어깨: [3],
    };
  };

  const priorityMap = getPriorityMap(exerciseType);

  // 각 결과를 부위별로 분류
  results.forEach((result) => {
    const bodyPart = categoryIdToBodyPart(result.categoryId, exerciseType);
    if (bodyPart && bodyPartScores.hasOwnProperty(bodyPart)) {
      // 백엔드에서 내려온 score 값만 사용
      bodyPartScores[bodyPart].push(result.score);

      // 실제 수행 데이터 저장 (우선순위에 따라 첫 번째로 매칭되는 것 선택)
      const exerciseName = categoryIdToExerciseName(result.categoryId);
      if (exerciseName) {
        const priorities = priorityMap[bodyPart] || [];
        if (priorities.includes(result.categoryId)) {
          const currentPriority = priorities.indexOf(result.categoryId);
          const existingCategoryId = results.find(
            (r) => categoryIdToBodyPart(r.categoryId, exerciseType) === bodyPart && bodyPartData[bodyPart].exerciseName === categoryIdToExerciseName(r.categoryId)
          )?.categoryId;
          const existingPriority = existingCategoryId ? priorities.indexOf(existingCategoryId) : -1;

          if (existingPriority === -1 || currentPriority < existingPriority) {
            bodyPartData[bodyPart] = {
              exerciseName,
              value: result.value,
              unit: result.unit,
            };
          }
        } else if (!bodyPartData[bodyPart].exerciseName) {
          // 우선순위에 없으면 첫 번째로 발견된 것 사용
          bodyPartData[bodyPart] = {
            exerciseName,
            value: result.value,
            unit: result.unit,
          };
        }
      }
    }
  });

  // 부위별 평균 계산 (측정되지 않은 부위는 0)
  const data = labels.map((bodyPart) => {
    const scores = bodyPartScores[bodyPart];
    if (scores.length === 0) return 0; // 측정되지 않은 부위는 0
    // 평균 계산
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  });

  return { labels, data, bodyPartData: bodyPartData || {} };
};

export default function MeasurementRadarChart({ results, title, showDataLabels = true, exerciseType }: MeasurementRadarChartProps) {
  const { labels, data, bodyPartData } = convertResultsToRadarData(results || [], exerciseType);

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
      {/* 실제 수행 데이터 표시 */}
      {showDataLabels && bodyPartData && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-5 gap-2 text-xs">
            {labels.map((bodyPart) => {
              const dataInfo = bodyPartData[bodyPart];
              if (!dataInfo || !dataInfo.exerciseName) {
                return (
                  <div key={bodyPart} className="text-center">
                    <div className="font-medium text-gray-400">{bodyPart}</div>
                    <div className="text-gray-400">-</div>
                  </div>
                );
              }
              return (
                <div key={bodyPart} className="text-center">
                  <div className="font-medium text-gray-700">{bodyPart}</div>
                  <div className="text-gray-600">
                    {dataInfo.exerciseName}
                    {dataInfo.unit === "level" ? (
                      <span className="ml-1">(으악 {dataInfo.value})</span>
                    ) : (
                      <>
                        {" "}
                        {dataInfo.value}
                        {dataInfo.unit === "reps" ? "회" : dataInfo.unit === "kg" ? "kg" : ""}
                      </>
                    )}
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
