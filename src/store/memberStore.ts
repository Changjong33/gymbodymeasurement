import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Member {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  notes?: string;
  createdAt: string;
}

interface MemberState {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, memberData: Omit<Member, 'id' | 'createdAt'>) => void;
  removeMember: (id: string) => void;
  getMember: (id: string) => Member | undefined;
  setMembers: (members: Member[]) => void;
}

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      addMember: (memberData) => {
        const newMember: Member = {
          ...memberData,
          id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          members: [...state.members, newMember],
        }));
      },
      updateMember: (id, memberData) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? { ...member, ...memberData }
              : member
          ),
        }));
      },
      removeMember: (id) => {
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        }));
      },
      getMember: (id) => {
        return get().members.find((member) => member.id === id);
      },
      setMembers: (newMembers) => {
        set({ members: newMembers });
      },
    }),
    {
      name: 'member-storage',
    }
  )
);

