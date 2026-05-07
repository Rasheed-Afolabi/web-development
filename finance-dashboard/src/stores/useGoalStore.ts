import { create } from 'zustand';
import { addMonths, formatISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_GOAL_TARGET, DEFAULT_GOAL_MONTHS } from '@/data/constants';
import type { SavingsGoal } from '@/types';

interface GoalState {
  goals: SavingsGoal[];
  activeGoalId: string | null;
  hydrateGoals: (goals: SavingsGoal[], activeGoalId: string | null) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => string;
  updateGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  setActiveGoal: (id: string) => void;
  getActiveGoal: () => SavingsGoal | null;
  // Legacy compat
  hydrateGoal: (goal: { targetAmount: number; startDate: string; endDate: string; id?: string; name?: string }) => void;
}

function makeDefaultGoal(): SavingsGoal {
  const now = new Date();
  return {
    id: uuidv4(),
    name: 'Savings Goal',
    targetAmount: DEFAULT_GOAL_TARGET,
    startDate: formatISO(now, { representation: 'date' }),
    endDate: formatISO(addMonths(now, DEFAULT_GOAL_MONTHS), { representation: 'date' }),
  };
}

const defaultGoal = makeDefaultGoal();

export const useGoalStore = create<GoalState>()((set, get) => ({
  goals: [defaultGoal],
  activeGoalId: defaultGoal.id,

  hydrateGoals: (goals, activeGoalId) => set({ goals, activeGoalId }),

  hydrateGoal: (goal) => {
    // Legacy migration: single goal → array
    const id = goal.id || uuidv4();
    const name = goal.name || 'Savings Goal';
    const migrated: SavingsGoal = {
      id,
      name,
      targetAmount: goal.targetAmount,
      startDate: goal.startDate,
      endDate: goal.endDate,
    };
    set({ goals: [migrated], activeGoalId: id });
  },

  addGoal: (goal) => {
    const id = uuidv4();
    const newGoal: SavingsGoal = { ...goal, id };
    set((state) => ({
      goals: [...state.goals, newGoal],
      activeGoalId: id,
    }));
    return id;
  },

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  deleteGoal: (id) =>
    set((state) => {
      const remaining = state.goals.filter((g) => g.id !== id);
      return {
        goals: remaining,
        activeGoalId:
          state.activeGoalId === id
            ? remaining[0]?.id ?? null
            : state.activeGoalId,
      };
    }),

  setActiveGoal: (id) => set({ activeGoalId: id }),

  getActiveGoal: () => {
    const state = get();
    return state.goals.find((g) => g.id === state.activeGoalId) ?? state.goals[0] ?? null;
  },
}));
