"use client";

// 맨몸운동 섹션 타입 정의
interface BodyweightSection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType: "reps";
  category: "bodyweight";
  options: { name: string; label: string }[];
}

// 맨몸운동 섹션 데이터
export const bodyweightSections: BodyweightSection[] = [
  {
    title: "[등] 풀업",
    prefix: "pullup",
    kgField: "pullupReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "pullupArms", label: "팔 위주로 당겨짐" },
      { name: "pullupLatsFeel", label: "광배 자극 인지 어려움" },
      { name: "pullupBounce", label: "반동 사용" },
      { name: "pullupScapula", label: "견갑 조절 어려움" },
    ],
  },
  {
    title: "[코어] 윗몸일으키기",
    prefix: "situp",
    kgField: "situpReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "situpLowerBack", label: "허리 불편감" },
      { name: "situpBounce", label: "반동 사용" },
      { name: "situpCoreTension", label: "코어 긴장 유지 어려움" },
      { name: "situpBodyShake", label: "상체 흔들림" },
    ],
  },
];

// 맨몸운동 섹션 컴포넌트
export default function BodyweightSection({ section }: { section: BodyweightSection }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
      <div className="max-w-xs">
        <div>
          <label className="block font-medium mb-1 text-gray-700" htmlFor={section.kgField}>
            횟수 (회)
          </label>
          <input id={section.kgField} name={section.kgField} type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="횟수" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-red-500 font-medium mb-2">선택사항</div>
        <div className="flex flex-col gap-1">
          {section.options.map((option) => (
            <label key={option.name} className="inline-flex items-center">
              <input type="checkbox" name={option.name} className="form-checkbox text-green-600" />
              <span className="ml-2">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
