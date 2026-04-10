import { useMemo } from 'react';
import { useGoalStore } from '@/stores/useGoalStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { calculateGoalProgress } from '@/lib/calculations';
import type { GoalProgress } from '@/types';

export function useGoalProgress(): GoalProgress {
  const goal = useGoalStore();
  const transactions = useTransactionStore((s) => s.transactions);

  return useMemo(
    () =>
      calculateGoalProgress(
        {
          targetAmount: goal.targetAmount,
          startDate: goal.startDate,
          endDate: goal.endDate,
        },
        transactions,
      ),
    [goal.targetAmount, goal.startDate, goal.endDate, transactions],
  );
}
