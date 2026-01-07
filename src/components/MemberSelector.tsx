import Link from "next/link";
import { useState } from "react";

interface Member {
  id: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
}

interface MemberSelectorProps {
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
}

export default function MemberSelector({ members, selectedMemberId, onSelectMember }: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 검색 필터링
  const filteredMembers = searchQuery.trim()
    ? members.filter(
        (member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.age.toString().includes(searchQuery) || (member.gender === "male" ? "남" : "여").includes(searchQuery)
      )
    : members;

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  if (members.length === 0) {
    return (
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50 text-center">
        <p className="text-gray-600 mb-2">등록된 회원이 없습니다.</p>
        <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium underline">
          회원정보등록 페이지로 이동
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 검색 바 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="회원 이름, 나이, 성별로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* 회원 목록 */}
      <div className="grid grid-cols-1 gap-3 mb-4 max-h-96 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="col-span-2 text-center py-4 text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          filteredMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember(member.id)}
              className={`p-3 border-2 rounded-lg text-left transition-all flex justify-between items-center ${
                selectedMemberId === member.id ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">{member.name}</div>
              <div className="text-sm text-gray-600">
                {member.gender === "male" ? "남" : "여"} | {member.age}세 | {member.height}cm | {member.weight}kg
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
