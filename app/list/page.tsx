"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMemberStore, Member } from "@/store/memberStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { getMembersApi } from "@/lib/api";

export default function ListPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const { members, removeMember, updateMember, setMembers } = useMemberStore();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [showInjuryToggle, setShowInjuryToggle] = useState(false);
  const [showMoreInjuries, setShowMoreInjuries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 검색어에 따라 회원 필터링
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 실제 인증 상태 가져오기 (개발 모드 우회 포함)
  const { isLoggedIn } = getEffectiveAuth();
  const devMode = isDevMode();

  // 로그인 체크 (개발 모드에서는 우회)
  useEffect(() => {
    if (!isLoggedIn && !devMode) {
      router.push("/login");
    }
  }, [isLoggedIn, devMode, router]);

  // 회원 목록 조회
  useEffect(() => {
    const fetchMembers = async () => {
      if (!isLoggedIn && !devMode) return;
      
      setIsLoading(true);
      try {
        // gymId는 일단 1로 설정 (추후 로그인한 gym의 ID로 변경 가능)
        const gymId = 1;
        const response = await getMembersApi(gymId);
        
        console.log("회원 목록 조회 응답:", response);
        
        if (response.members && Array.isArray(response.members)) {
          // 백엔드 응답을 프론트엔드 Member 형식으로 변환
          const convertedMembers: Member[] = response.members.map((member: any) => {
            // height와 weight가 문자열일 수 있으므로 숫자로 변환
            const height = typeof member.height === 'string' 
              ? parseFloat(member.height) 
              : (member.height || 0);
            const weight = typeof member.weight === 'string' 
              ? parseFloat(member.weight) 
              : (member.weight || 0);
            
            return {
              id: member.id?.toString() || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: member.name || "",
              gender: member.gender === "M" ? "male" : "female",
              age: typeof member.age === 'number' ? member.age : parseInt(member.age || "0", 10),
              height: height,
              weight: weight,
              notes: member.notes || undefined,
              createdAt: member.createdAt 
                ? (typeof member.createdAt === 'string' ? member.createdAt : new Date(member.createdAt).toISOString())
                : new Date().toISOString(),
            };
          });
          setMembers(convertedMembers);
        } else {
          console.warn("회원 목록이 배열이 아닙니다:", response);
        }
      } catch (error) {
        console.error("회원 목록 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [isLoggedIn, devMode, setMembers]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음 (개발 모드 제외)
  if (!isLoggedIn && !devMode) {
    return null;
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name} 회원의 정보를 삭제하시겠습니까?`)) {
      removeMember(id);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember({ ...member });
    // 기존 특이사항을 배열로 변환
    if (member.notes) {
      setInjuries(member.notes.split(", "));
    } else {
      setInjuries([]);
    }
    setShowInjuryToggle(false);
  };

  const handleCloseModal = () => {
    setEditingMember(null);
    setInjuries([]);
    setShowInjuryToggle(false);
    setShowMoreInjuries(false);
  };

  const handleInjuryChange = (injury: string) => {
    setInjuries((prev) => {
      if (prev.includes(injury)) {
        return prev.filter((item) => item !== injury);
      } else {
        return [...prev, injury];
      }
    });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const gender = formData.get("gender") as "male" | "female";
    const age = parseInt(formData.get("age") as string);
    const height = parseFloat(formData.get("height") as string);
    const weight = parseFloat(formData.get("weight") as string);

    // 유효성 검사
    if (!name || !gender || !age || !height || !weight) {
      alert("모든 필드를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      alert("나이, 키, 몸무게는 0보다 큰 값을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 부상 부위를 notes로 변환 (선택사항)
    const notes = injuries.length > 0 ? injuries.join(", ") : undefined;

    updateMember(editingMember.id, {
      name,
      gender,
      age,
      height,
      weight,
      notes,
    });

    setIsSubmitting(false);
    setEditingMember(null);
    setInjuries([]);
    setShowInjuryToggle(false);
    setShowMoreInjuries(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(members, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📋</span>
          <h1 className="text-4xl font-bold text-gray-800">회원정보목록</h1>
        </div>
        <p className="text-gray-600 text-lg ml-12">등록된 모든 회원 정보를 조회하고 관리합니다</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">⏳</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">회원 정보를 불러오는 중...</h2>
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">👥</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">등록된 회원이 없습니다</h2>
            <p className="text-gray-500">회원정보등록 페이지에서 새로운 회원을 등록해주세요.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
              <h2 className="text-xl font-semibold text-gray-700 whitespace-nowrap">
                총 {filteredMembers.length}명의 회원
                {searchQuery && ` (검색 결과: ${filteredMembers.length}명)`}
              </h2>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="회원 이름으로 검색..."
                    className="w-full border border-gray-300 rounded-md px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleExport} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium whitespace-nowrap">
              📥 데이터 내보내기 (JSON)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">성별</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">나이</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">키(cm)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">몸무게(kg)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">특이사항</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">등록일</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-gray-600">{member.gender === "male" ? "남" : "여"}</td>
                    <td className="py-3 px-4 text-gray-600">{member.age}세</td>
                    <td className="py-3 px-4 text-gray-600">{member.height}cm</td>
                    <td className="py-3 px-4 text-gray-600">{member.weight}kg</td>
                    <td className="py-3 px-4 text-gray-600 text-sm max-w-[200px]">
                      <div className="truncate" title={member.notes || "-"}>
                        {member.notes || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{new Date(member.createdAt).toLocaleDateString("ko-KR")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(member)} className="text-blue-500 hover:text-blue-700 font-medium text-sm">
                          수정
                        </button>
                        <button onClick={() => handleDelete(member.id, member.name)} className="text-red-500 hover:text-red-700 font-medium text-sm">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">회원정보 수정</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-name">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingMember.name}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-gender">
                  성별 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-5">
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="male" required defaultChecked={editingMember.gender === "male"} className="form-radio text-blue-600" />
                    <span className="ml-2">남</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="female" required defaultChecked={editingMember.gender === "female"} className="form-radio text-blue-600" />
                    <span className="ml-2">여</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-age">
                  나이 <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-age"
                  name="age"
                  type="number"
                  min="1"
                  required
                  defaultValue={editingMember.age}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="나이를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-height">
                  키(cm) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-height"
                  name="height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  defaultValue={editingMember.height}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="키를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-weight">
                  몸무게(kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-weight"
                  name="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  defaultValue={editingMember.weight}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="몸무게를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">특이사항 (부상)</label>
                
                {!showInjuryToggle ? (
                  <button
                    type="button"
                    onClick={() => setShowInjuryToggle(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    + 추가하기
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* 주요 부상 부위 */}
                    <div className="flex flex-wrap gap-3">
                      {["무릎", "발목", "어깨", "허리", "손목", "목"].map((injury) => (
                        <label key={injury} className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={injuries.includes(injury)}
                            onChange={() => handleInjuryChange(injury)}
                            className="form-checkbox text-blue-600 rounded"
                          />
                          <span className="ml-2 text-gray-700 text-sm">{injury}</span>
                        </label>
                      ))}
                    </div>

                    {/* 더보기 버튼 */}
                    <button
                      type="button"
                      className="text-blue-600 text-sm font-medium focus:outline-none hover:underline transition-all duration-300"
                      onClick={() => setShowMoreInjuries((prev) => !prev)}
                    >
                      {showMoreInjuries ? "숨기기 ▲" : "+ 더보기 ▼"}
                    </button>

                    {/* 추가 부상 부위 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMoreInjuries ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                        {[
                          "고관절",
                          "발가락",
                          "햄스트링",
                          "대퇴사두근",
                          "종아리",
                          "아킬레스건",
                          "골반",
                          "좌골신경통",
                          "회전근개",
                          "팔꿈치",
                          "이두",
                          "삼두",
                          "가슴",
                          "등",
                          "광배",
                          "승모",
                          "복부",
                          "옆구리",
                        ].map((injury) => (
                          <label key={injury} className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={injuries.includes(injury)}
                              onChange={() => handleInjuryChange(injury)}
                              className="form-checkbox text-blue-600 rounded"
                            />
                            <span className="ml-2 text-gray-700 text-sm">{injury}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium">
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
