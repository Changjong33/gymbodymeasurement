"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMemberStore, Member } from "@/store/memberStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function ListPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { members, removeMember, updateMember } = useMemberStore();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!isLoggedIn) {
    return null;
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name} 회원의 정보를 삭제하시겠습니까?`)) {
      removeMember(id);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember({ ...member });
  };

  const handleCloseModal = () => {
    setEditingMember(null);
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

    updateMember(editingMember.id, {
      name,
      gender,
      age,
      height,
      weight,
    });

    setIsSubmitting(false);
    setEditingMember(null);
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

      {members.length === 0 ? (
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">총 {members.length}명의 회원</h2>
            <button onClick={handleExport} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">등록일</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-gray-600">{member.gender === "male" ? "남" : "여"}</td>
                    <td className="py-3 px-4 text-gray-600">{member.age}세</td>
                    <td className="py-3 px-4 text-gray-600">{member.height}cm</td>
                    <td className="py-3 px-4 text-gray-600">{member.weight}kg</td>
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
                ))}
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
