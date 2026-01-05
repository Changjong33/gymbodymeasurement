import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Measurement {
  id: string;
  memberId: string;
  memberName: string;
  createdAt: string;
  // 체성분
  muscle?: number;
  bodyfat?: number;
  beforeIntenseExercise?: boolean;
  waterIntakeDifferent?: boolean;
  recentWeightChange?: boolean;
  // 하체 - 바벨 스쿼트
  squatKg?: number;
  squatReps?: number;
  squatDepth?: boolean;
  squatKneePain?: boolean;
  squatLowerBack?: boolean;
  squatBalance?: boolean;
  // 가슴 - 벤치프레스
  benchKg?: number;
  benchReps?: number;
  benchShoulderDiscomfort?: boolean;
  benchRangeLimit?: boolean;
  benchImbalance?: boolean;
  benchScapula?: boolean;
  // 등 - 랫풀다운
  latKg?: number;
  latReps?: number;
  latArms?: boolean;
  latLatsFeel?: boolean;
  latBounce?: boolean;
  latScapula?: boolean;
  // 어깨 - 숄더프레스
  shoulderKg?: number;
  shoulderReps?: number;
  shoulderOverextend?: boolean;
  shoulderPain?: boolean;
  shoulderRange?: boolean;
  shoulderCore?: boolean;
  // 코어 - 플랭크
  plankSec?: number;
  plankSag?: boolean;
  plankShake?: boolean;
  plankBreath?: boolean;
  plankCollapse?: boolean;
}

interface MeasurementState {
  measurements: Measurement[];
  addMeasurement: (measurement: Omit<Measurement, 'id' | 'createdAt'>) => void;
  removeMeasurement: (id: string) => void;
  getMeasurementsByMember: (memberId: string) => Measurement[];
  getMeasurement: (id: string) => Measurement | undefined;
}

export const useMeasurementStore = create<MeasurementState>()(
  persist(
    (set, get) => ({
      measurements: [],
      addMeasurement: (measurementData) => {
        const newMeasurement: Measurement = {
          ...measurementData,
          id: `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          measurements: [...state.measurements, newMeasurement],
        }));
      },
      removeMeasurement: (id) => {
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        }));
      },
      getMeasurementsByMember: (memberId) => {
        return get().measurements.filter((m) => m.memberId === memberId);
      },
      getMeasurement: (id) => {
        return get().measurements.find((m) => m.id === id);
      },
    }),
    {
      name: 'measurement-storage',
    }
  )
);

