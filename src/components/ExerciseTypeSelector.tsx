import { BaseSection } from "../types/exercise";

type ExerciseType = "flexibility" | "bodyweight" | "weight";

interface ExerciseTypeSelectorProps {
  selectedExerciseTypes: ExerciseType[];
  onToggleExerciseType: (type: ExerciseType) => void;
  filteredExerciseSections: Array<{ section: BaseSection }>;
}

export default function ExerciseTypeSelector({
  selectedExerciseTypes,
  onToggleExerciseType,
  filteredExerciseSections,
}: ExerciseTypeSelectorProps) {
  const sectionsByType = (type: ExerciseType) =>
    filteredExerciseSections
      .filter(({ section }) => section.category === type)
      .map(({ section }) => section.title);

  const renderExpandableList = (type: ExerciseType) => {
    const isOpen = selectedExerciseTypes.includes(type);
    const titles = sectionsByType(type);

    // 버튼 안에서 "입 벌리듯" 펼쳐지는 느낌: grid-rows(0fr -> 1fr) 트랜지션
    // - max-height/scale 조합은 닫힐 때 레이아웃이 "툭" 움직일 수 있어 grid-rows 방식으로 안정화
    return (
      <div
        className={[
          "w-full grid overflow-hidden",
          "transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out",
          isOpen ? "mt-3 opacity-100 grid-rows-[1fr]" : "mt-0 opacity-0 grid-rows-[0fr]",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        <div className="min-h-0">
          <div className="w-full rounded-lg bg-yellow-100 border border-yellow-200 px-3 py-2 text-left">
          {titles.length > 0 ? (
            <ul className="text-sm text-yellow-900 space-y-1">
              {titles.map((title, idx) => (
                <li key={`${type}-${idx}`} className="leading-snug">
                  - {title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-yellow-900">해당 타입의 측정 항목이 없습니다.</div>
          )}
        </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 운동 타입 선택 버튼 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <button
          type="button"
          onClick={() => onToggleExerciseType("flexibility")}
          className={`p-6 border-2 rounded-lg text-center transition-all flex flex-col items-center self-start ${
            selectedExerciseTypes.includes("flexibility")
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className="text-4xl mb-2">🧘</div>
          <div className="font-semibold text-gray-800">유연성</div>
          {renderExpandableList("flexibility")}
        </button>
        <button
          type="button"
          onClick={() => onToggleExerciseType("bodyweight")}
          className={`p-6 border-2 rounded-lg text-center transition-all flex flex-col items-center self-start ${
            selectedExerciseTypes.includes("bodyweight")
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className="text-4xl mb-2">💪</div>
          <div className="font-semibold text-gray-800">맨몸운동</div>
          {renderExpandableList("bodyweight")}
        </button>
        <button
          type="button"
          onClick={() => onToggleExerciseType("weight")}
          className={`p-6 border-2 rounded-lg text-center transition-all flex flex-col items-center self-start ${
            selectedExerciseTypes.includes("weight")
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className="text-4xl mb-2">🏋️</div>
          <div className="font-semibold text-gray-800">웨이트 트레이닝</div>
          {renderExpandableList("weight")}
        </button>
      </div>

      {/* 선택된 운동 표시 */}
      {selectedExerciseTypes.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          선택된 운동:{" "}
          {selectedExerciseTypes
            .map((type) =>
              type === "flexibility"
                ? "유연성"
                : type === "bodyweight"
                ? "맨몸운동"
                : "웨이트 트레이닝"
            )
            .join(", ")}
        </div>
      )}
    </>
  );
}

