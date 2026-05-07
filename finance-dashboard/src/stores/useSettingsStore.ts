import { create } from 'zustand';
import type { BudgetMode, CurrencyCode, HouseholdMember, IncomeStream } from '@/types';

interface SettingsState {
  weeklyIncomeTargets: Record<IncomeStream, number>; // in cents
  budgetMode: BudgetMode;
  householdMembers: HouseholdMember[];
  currentMemberId: string;
  defaultCurrency: CurrencyCode;
  hydrateSettings: (targets: Record<IncomeStream, number>) => void;
  hydrateSettingsV3: (v3: {
    budgetMode?: string;
    householdMembers?: unknown[];
    currentMemberId?: string;
    defaultCurrency?: string;
  }) => void;
  setWeeklyIncomeTarget: (stream: IncomeStream, amount: number) => void;
  setAllWeeklyIncomeTargets: (targets: Record<IncomeStream, number>) => void;
  setBudgetMode: (mode: BudgetMode) => void;
  addHouseholdMember: (member: HouseholdMember) => void;
  removeHouseholdMember: (id: string) => void;
  setCurrentMemberId: (id: string) => void;
  setDefaultCurrency: (code: CurrencyCode) => void;
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
  budgetMode: 'allowance',
  householdMembers: [],
  currentMemberId: '',
  defaultCurrency: 'USD',

  hydrateSettings: (targets) => set({ weeklyIncomeTargets: targets }),

  hydrateSettingsV3: (v3) =>
    set({
      budgetMode: (v3.budgetMode as BudgetMode) || 'allowance',
      householdMembers: (v3.householdMembers as HouseholdMember[]) || [],
      currentMemberId: v3.currentMemberId || '',
      defaultCurrency: (v3.defaultCurrency as CurrencyCode) || 'USD',
    }),

  setWeeklyIncomeTarget: (stream, amount) =>
    set((state) => ({
      weeklyIncomeTargets: { ...state.weeklyIncomeTargets, [stream]: amount },
    })),

  setAllWeeklyIncomeTargets: (targets) =>
    set({ weeklyIncomeTargets: targets }),

  setBudgetMode: (mode) => set({ budgetMode: mode }),

  addHouseholdMember: (member) =>
    set((s) => ({ householdMembers: [...s.householdMembers, member] })),

  removeHouseholdMember: (id) =>
    set((s) => ({ householdMembers: s.householdMembers.filter((m) => m.id !== id) })),

  setCurrentMemberId: (id) => set({ currentMemberId: id }),

  setDefaultCurrency: (code) => set({ defaultCurrency: code }),
}));
