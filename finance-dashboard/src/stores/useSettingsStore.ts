import { create } from 'zustand';
import type { IncomeStream } from '@/types';

interface SettingsState {
  weeklyIncomeTargets: Record<IncomeStream, number>; // in cents
  hydrateSettings: (targets: Record<IncomeStream, number>) => void;
  setWeeklyIncomeTarget: (stream: IncomeStream, amount: number) => void;
  setAllWeeklyIncomeTargets: (targets: Record<IncomeStream, number>) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  weeklyIncomeTargets: {
    'ai-projects': 0,
    'delivery': 0,
    'factory': 0,
    'other': 0,
  },
  hydrateSettings: (targets) => set({ weeklyIncomeTargets: targets }),
  setWeeklyIncomeTarget: (stream, amount) =>
    set((state) => ({
      weeklyIncomeTargets: { ...state.weeklyIncomeTargets, [stream]: amount },
    })),
  setAllWeeklyIncomeTargets: (targets) =>
    set({ weeklyIncomeTargets: targets }),
}));
