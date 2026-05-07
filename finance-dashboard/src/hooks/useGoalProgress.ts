import { useMemo } from 'react';
import { useGoalStore } from '@/stores/useGoalStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { calculateGoalProgress } from '@/lib/calculations';
import type { GoalProgress } from '@/types';

export function useGoalProgress(goalId?: string): GoalProgress {
  const goals = useGoalStore((s) => s.goals);
  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const transactions = useTransactionStore((s) => s.transactions);

  const goal = useMemo(() => {
    const id = goalId ?? activeGoalId;
    return goals.find((g) => g.id === id) ?? goals[0] ?? null;
  }, [goals, activeGoalId, goalId]);

  return useMemo(() => {
    if (!goal) {
      return {
        currentSaved: 0,
        targetAmount: 0,
        totalDays: 1,
        elapsedDays: 0,
        remainingDays: 1,
        remainingAmount: 0,
        requiredDailyRate: 0,
        requiredWeeklyRate: 0,
        requiredMonthlyRate: 0,
        expectedByNow: 0,
        paceStatus: 'on-track' as const,
        percentComplete: 0,
      };
    }
    return calculateGoalProgress(goal, transactions);
  }, [goal, transactions]);
}
