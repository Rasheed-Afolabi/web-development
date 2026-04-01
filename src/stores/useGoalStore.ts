import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addMonths, formatISO } from 'date-fns';
import { DEFAULT_GOAL_TARGET, DEFAULT_GOAL_MONTHS, STORAGE_KEYS } from '@/data/constants';
import type { SavingsGoal } from '@/types';

interface GoalState extends SavingsGoal {
  updateGoal: (goal: Partial<SavingsGoal>) => void;
  resetGoal: () => void;
}

const today = formatISO(new Date(), { representation: 'date' });
const defaultGoal: SavingsGoal = {
  targetAmount: DEFAULT_GOAL_TARGET,
  startDate: today,
  endDate: formatISO(addMonths(new Date(), DEFAULT_GOAL_MONTHS), { representation: 'date' }),
};

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      ...defaultGoal,
      updateGoal: (goal) => set((state) => ({ ...state, ...goal })),
      resetGoal: () => {
        const now = new Date();
        set({
          targetAmount: DEFAULT_GOAL_TARGET,
          startDate: formatISO(now, { representation: 'date' }),
          endDate: formatISO(addMonths(now, DEFAULT_GOAL_MONTHS), { representation: 'date' }),
        });
      },
    }),
    { name: STORAGE_KEYS.GOAL },
  ),
);
