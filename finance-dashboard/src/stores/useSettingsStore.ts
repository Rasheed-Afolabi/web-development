import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IncomeStream } from '@/types';
import { STORAGE_KEYS } from '@/data/constants';

interface SettingsState {
  weeklyIncomeTargets: Record<IncomeStream, number>; // in cents
  setWeeklyIncomeTarget: (stream: IncomeStream, amount: number) => void;
  setAllWeeklyIncomeTargets: (targets: Record<IncomeStream, number>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weeklyIncomeTargets: {
        'ai-projects': 0,
        'delivery': 0,
        'factory': 0,
        'other': 0,
      },
      setWeeklyIncomeTarget: (stream, amount) =>
        set((state) => ({
          weeklyIncomeTargets: { ...state.weeklyIncomeTargets, [stream]: amount },
        })),
      setAllWeeklyIncomeTargets: (targets) =>
        set({ weeklyIncomeTargets: targets }),
    }),
    { name: STORAGE_KEYS.SETTINGS },
  ),
);
