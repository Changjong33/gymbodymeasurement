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
export function convertFormDataToMeasurement(
  formData: FormData,
  selectedMemberId: string,
  memberName: string,
  selectedExerciseTypes: string[]
) {
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
    // 유연성
    thoracicMobility: formData.get("thoracicMobility") as string | null,
    shoulderFlexibility: formData.get("shoulderFlexibility") as string | null,
    hamstring: formData.get("hamstring") as string | null,
    hipMobility: formData.get("hipMobility") as string | null,
    ankleMobility: formData.get("ankleMobility") as string | null,
  };
}

// 측정 데이터를 API 요청 형식으로 변환
export function convertMeasurementToApiRequest(measurementData: any) {
  const measurements: Array<{ categoryId: number; value: number }> = [];

  // categoryId 매핑: 1=벤치프레스, 2=풀업, 3=숄더프레스, 4=바벨스쿼트, 5=윗몸일으키기
  if (measurementData.benchKg) {
    measurements.push({ categoryId: 1, value: measurementData.benchKg });
  }
  if (measurementData.pullupReps) {
    measurements.push({ categoryId: 2, value: measurementData.pullupReps });
  }
  if (measurementData.shoulderKg) {
    measurements.push({ categoryId: 3, value: measurementData.shoulderKg });
  }
  if (measurementData.squatKg) {
    measurements.push({ categoryId: 4, value: measurementData.squatKg });
  }
  if (measurementData.situpReps) {
    measurements.push({ categoryId: 5, value: measurementData.situpReps });
  }

  return measurements;
}

