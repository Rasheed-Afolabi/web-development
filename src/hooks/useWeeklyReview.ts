import { useMemo } from 'react';
import { subWeeks } from 'date-fns';
import { useTransactions } from './useTransactions';
import { getWeekRange, sumTransactions, filterTransactionsByDateRange, groupByCategoryGroup } from '@/lib/calculations';
import { useTransactionStore } from '@/stores/useTransactionStore';

export function useWeeklyReview(referenceDate: Date) {
  const { start, end } = useMemo(() => getWeekRange(referenceDate), [referenceDate]);
  const currentWeek = useTransactions(start, end);

  const prevWeekStart = useMemo(() => subWeeks(start, 1), [start]);
  const prevWeekEnd = useMemo(() => subWeeks(end, 1), [end]);
  const allTransactions = useTransactionStore((s) => s.transactions);

  const previousWeek = useMemo(() => {
    const filtered = filterTransactionsByDateRange(allTransactions, prevWeekStart, prevWeekEnd);
    return {
      income: sumTransactions(filtered, 'income'),
      expenses: sumTransactions(filtered, 'expense'),
    };
  }, [allTransactions, prevWeekStart, prevWeekEnd]);

  const categoryGroups = useMemo(
    () => groupByCategoryGroup(currentWeek.transactions),
    [currentWeek.transactions],
  );

  const weekOverWeekTrend = useMemo(() => {
    const currentNet = currentWeek.income - currentWeek.expenses;
    const prevNet = previousWeek.income - previousWeek.expenses;
    if (currentNet > prevNet) return 'up' as const;
    if (currentNet < prevNet) return 'down' as const;
    return 'flat' as const;
  }, [currentWeek, previousWeek]);

  return {
    ...currentWeek,
    weekStart: start,
    weekEnd: end,
    previousWeek,
    categoryGroups,
    weekOverWeekTrend,
  };
}
