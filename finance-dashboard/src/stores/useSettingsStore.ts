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
    'freelance': 0,
    'tutoring': 0,
    'rideshare': 0,
    'tips': 0,
    'investments': 0,
    'rental-income': 0,
    'reselling': 0,
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
