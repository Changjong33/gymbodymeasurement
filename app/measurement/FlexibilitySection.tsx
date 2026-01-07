"use client";

// 유연성 운동 섹션 타입 정의
interface FlexibilitySection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType: "flexibility";
  category: "flexibility";
}

// 유연성 운동 섹션 데이터
export const flexibilitySections: FlexibilitySection[] = [
  {
    title: "흉추 가동성 테스트",
    prefix: "thoracic",
    kgField: "thoracicMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "어깨 유연성 테스트 (굽힘/폄/외전/내전/외회전/내회전)",
    prefix: "shoulderFlexibility",
    kgField: "shoulderFlexibility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "햄스트링",
    prefix: "hamstring",
    kgField: "hamstring",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "고관절 테스트 (굴곡/신전/스쿼트각도)",
    prefix: "hip",
    kgField: "hipMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "발목 가동성",
    prefix: "ankle",
    kgField: "ankleMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
];

// 유연성 섹션 컴포넌트
export default function FlexibilitySection({ section }: { section: FlexibilitySection }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
      <div className="mt-4">
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="good" className="form-radio text-green-600" />
            <span className="ml-2">좋음</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="normal" className="form-radio text-green-600" />
            <span className="ml-2">보통</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="low" className="form-radio text-green-600" />
            <span className="ml-2">낮음</span>
          </label>
        </div>
      </div>
    </div>
  );
}
