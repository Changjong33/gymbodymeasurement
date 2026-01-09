// 헬퍼 함수: FormData에서 숫자 값 가져오기
export const getNumber = (formData: FormData, key: string, isInt = false): number | undefined => {
  const value = formData.get(key);
  if (!value) return undefined;
  return isInt ? parseInt(value as string) : parseFloat(value as string);
};

// 헬퍼 함수: FormData에서 체크박스 값 가져오기
export const getCheckbox = (formData: FormData, key: string): boolean => {
  return formData.get(key) === "on";
};

// FormData를 측정 데이터로 변환
export function convertFormDataToMeasurement(formData: FormData, selectedMemberId: string, memberName: string, selectedExerciseTypes: string[]) {
  return {
    memberId: selectedMemberId,
    memberName,
    exerciseTypes: selectedExerciseTypes,
    // 체성분
    muscle: getNumber(formData, "muscle"),
    bodyfat: getNumber(formData, "bodyfat"),
    beforeIntenseExercise: getCheckbox(formData, "beforeIntenseExercise"),
    waterIntakeDifferent: getCheckbox(formData, "waterIntakeDifferent"),
    recentWeightChange: getCheckbox(formData, "recentWeightChange"),
    // 웨이트 트레이닝
    squatKg: getNumber(formData, "squatKg"),
    squatDepth: getCheckbox(formData, "squatDepth"),
    squatKneePain: getCheckbox(formData, "squatKneePain"),
    squatLowerBack: getCheckbox(formData, "squatLowerBack"),
    squatBalance: getCheckbox(formData, "squatBalance"),
    benchKg: getNumber(formData, "benchKg"),
    benchShoulderDiscomfort: getCheckbox(formData, "benchShoulderDiscomfort"),
    benchRangeLimit: getCheckbox(formData, "benchRangeLimit"),
    benchImbalance: getCheckbox(formData, "benchImbalance"),
    benchScapula: getCheckbox(formData, "benchScapula"),
    shoulderKg: getNumber(formData, "shoulderKg"),
    shoulderOverextend: getCheckbox(formData, "shoulderOverextend"),
    shoulderPain: getCheckbox(formData, "shoulderPain"),
    shoulderRange: getCheckbox(formData, "shoulderRange"),
    shoulderCore: getCheckbox(formData, "shoulderCore"),
    barbellRowKg: getNumber(formData, "barbellRowKg"),
    barbellRowArms: getCheckbox(formData, "barbellRowArms"),
    barbellRowLatsFeel: getCheckbox(formData, "barbellRowLatsFeel"),
    barbellRowLowerBack: getCheckbox(formData, "barbellRowLowerBack"),
    barbellRowImbalance: getCheckbox(formData, "barbellRowImbalance"),
    deadliftKg: getNumber(formData, "deadliftKg"),
    deadliftLowerBack: getCheckbox(formData, "deadliftLowerBack"),
    deadliftFormBreakdown: getCheckbox(formData, "deadliftFormBreakdown"),
    deadliftGrip: getCheckbox(formData, "deadliftGrip"),
    deadliftBalance: getCheckbox(formData, "deadliftBalance"),
    // 맨몸운동
    pullupReps: getNumber(formData, "pullupReps", true),
    pullupArms: getCheckbox(formData, "pullupArms"),
    pullupLatsFeel: getCheckbox(formData, "pullupLatsFeel"),
    pullupBounce: getCheckbox(formData, "pullupBounce"),
    pullupScapula: getCheckbox(formData, "pullupScapula"),
    situpReps: getNumber(formData, "situpReps", true),
    situpLowerBack: getCheckbox(formData, "situpLowerBack"),
    situpBounce: getCheckbox(formData, "situpBounce"),
    situpCoreTension: getCheckbox(formData, "situpCoreTension"),
    situpBodyShake: getCheckbox(formData, "situpBodyShake"),
    bodyweightSquatReps: getNumber(formData, "bodyweightSquatReps", true),
    bodyweightSquatDepth: getCheckbox(formData, "bodyweightSquatDepth"),
    bodyweightSquatKneePain: getCheckbox(formData, "bodyweightSquatKneePain"),
    bodyweightSquatLowerBack: getCheckbox(formData, "bodyweightSquatLowerBack"),
    bodyweightSquatBalance: getCheckbox(formData, "bodyweightSquatBalance"),
    pushupReps: getNumber(formData, "pushupReps", true),
    pushupShoulderDiscomfort: getCheckbox(formData, "pushupShoulderDiscomfort"),
    pushupRangeLimit: getCheckbox(formData, "pushupRangeLimit"),
    pushupImbalance: getCheckbox(formData, "pushupImbalance"),
    pushupCoreUnstable: getCheckbox(formData, "pushupCoreUnstable"),
    burpeeReps: getNumber(formData, "burpeeReps", true),
    burpeeBreathing: getCheckbox(formData, "burpeeBreathing"),
    burpeeFormBreakdown: getCheckbox(formData, "burpeeFormBreakdown"),
    burpeeLowerBack: getCheckbox(formData, "burpeeLowerBack"),
    burpeeEndurance: getCheckbox(formData, "burpeeEndurance"),
    // 유연성
    thoracicMobility: formData.get("thoracicMobility") as string | null,
    shoulderFlexibility: formData.get("shoulderFlexibility") as string | null,
    hamstring: formData.get("hamstring") as string | null,
    hipMobility: formData.get("hipMobility") as string | null,
    ankleMobility: formData.get("ankleMobility") as string | null,
  };
}

// 측정 데이터를 API 요청 형식으로 변환 (유연성 제외, 선택한 운동 타입만 포함)
export function convertMeasurementToApiRequest(measurementData: any, selectedExerciseTypes: string[] = []) {
  const measurements: Array<{ categoryId: number; value: number }> = [];

  // 웨이트 트레이닝이 선택된 경우만 처리
  if (selectedExerciseTypes.includes("weight")) {
    // categoryId 매핑: 웨이트 트레이닝
    // 1=벤치프레스, 3=숄더프레스, 4=바벨스쿼트, 6=바벨로우, 7=데드리프트
    if (measurementData.benchKg) {
      measurements.push({ categoryId: 1, value: measurementData.benchKg });
    }
    if (measurementData.shoulderKg) {
      measurements.push({ categoryId: 3, value: measurementData.shoulderKg });
    }
    if (measurementData.squatKg) {
      measurements.push({ categoryId: 4, value: measurementData.squatKg });
    }
    if (measurementData.barbellRowKg) {
      measurements.push({ categoryId: 6, value: measurementData.barbellRowKg });
    }
    if (measurementData.deadliftKg) {
      measurements.push({ categoryId: 7, value: measurementData.deadliftKg });
    }
  }

  // 맨몸 운동이 선택된 경우만 처리
  if (selectedExerciseTypes.includes("bodyweight")) {
    // categoryId 매핑: 맨몸 운동
    // 2=풀업, 5=윗몸일으키기, 8=푸쉬업, 9=스쿼트, 10=버피
    if (measurementData.pullupReps) {
      measurements.push({ categoryId: 2, value: measurementData.pullupReps });
    }
    if (measurementData.situpReps) {
      measurements.push({ categoryId: 5, value: measurementData.situpReps });
    }
    if (measurementData.pushupReps) {
      measurements.push({ categoryId: 8, value: measurementData.pushupReps });
    }
    if (measurementData.bodyweightSquatReps) {
      measurements.push({ categoryId: 9, value: measurementData.bodyweightSquatReps });
    }
    if (measurementData.burpeeReps) {
      measurements.push({ categoryId: 10, value: measurementData.burpeeReps });
    }
  }

  // 유연성은 백엔드로 전송하지 않음 (DB에 저장되지 않음, 차트에만 표시)

  return measurements;
}

// 유연성 데이터를 차트용 MeasurementResult 형식으로 변환 (로컬에서만 사용)
export function convertFlexibilityToChartData(measurementData: any): Array<{ categoryId: number; exerciseName: string; value: number; unit: string; score: number }> {
  const results: Array<{ categoryId: number; exerciseName: string; value: number; unit: string; score: number }> = [];

  // categoryId 매핑: 유연성
  // 11=흉추가동성, 12=어깨유연성, 13=햄스트링, 14=고관절, 15=발목가동성
  const flexibilityMap: Record<string, { categoryId: number; name: string }> = {
    thoracicMobility: { categoryId: 11, name: "흉추 가동성" },
    shoulderFlexibility: { categoryId: 12, name: "어깨 유연성" },
    hamstring: { categoryId: 13, name: "햄스트링" },
    hipMobility: { categoryId: 14, name: "고관절" },
    ankleMobility: { categoryId: 15, name: "발목 가동성" },
  };

  // 5단계 평가: excellent=5, good=4, normal=3, bad=2, very_bad=1
  const scoreMap: Record<string, number> = {
    excellent: 5,
    good: 4,
    normal: 3,
    bad: 2,
    very_bad: 1,
  };

  Object.entries(flexibilityMap).forEach(([field, { categoryId, name }]) => {
    const value = measurementData[field];
    if (value) {
      const score = scoreMap[value] || 3;
      results.push({
        categoryId,
        exerciseName: name,
        value: score,
        unit: "level",
        score,
      });
    }
  });

  return results;
}
