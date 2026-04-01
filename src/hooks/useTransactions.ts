import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import {
  filterTransactionsByDateRange,
  sumTransactions,
  groupByCategory,
  groupByIncomeStream,
  getDailyTotals,
  getTopCategories,
} from '@/lib/calculations';

export function useTransactions(start: Date, end: Date) {
  const allTransactions = useTransactionStore((s) => s.transactions);

  return useMemo(() => {
    const filtered = filterTransactionsByDateRange(allTransactions, start, end);
    const income = sumTransactions(filtered, 'income');
    const expenses = sumTransactions(filtered, 'expense');
    const net = income - expenses;
    const byCategory = groupByCategory(filtered.filter((t) => t.type === 'expense'));
    const byIncomeStream = groupByIncomeStream(filtered);
    const dailyTotals = getDailyTotals(filtered, start, end);
    const topCategories = getTopCategories(filtered);

    return {
      transactions: filtered,
      income,
      expenses,
      net,
      byCategory,
      byIncomeStream,
      dailyTotals,
      topCategories,
    };
  }, [allTransactions, start, end]);
}
