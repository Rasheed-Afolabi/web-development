import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  parseISO,
  format,
  eachDayOfInterval,
  isWithinInterval,
} from 'date-fns';
import type { Transaction, PaceStatus, GoalProgress, SavingsGoal, ExpenseCategoryGroup } from '@/types';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Transaction[] {
  return transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
}

export function sumTransactions(transactions: Transaction[], type?: 'income' | 'expense'): number {
  return transactions
    .filter((t) => !type || t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function groupByCategory(transactions: Transaction[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const t of transactions) {
    groups[t.category] = (groups[t.category] || 0) + t.amount;
  }
  return groups;
}

export function groupByCategoryGroup(transactions: Transaction[]): Record<ExpenseCategoryGroup, number> {
  const groups: Record<string, number> = {
    essentials: 0,
    'earning-costs': 0,
    lifestyle: 0,
    growth: 0,
    commitments: 0,
  };
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const cat = EXPENSE_CATEGORIES[t.category];
    if (cat) {
      groups[cat.group] = (groups[cat.group] || 0) + t.amount;
    }
  }
  return groups as Record<ExpenseCategoryGroup, number>;
}

export function groupByIncomeStream(transactions: Transaction[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'income' && t.incomeStream) {
      groups[t.incomeStream] = (groups[t.incomeStream] || 0) + t.amount;
    }
  }
  return groups;
}

export function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  }
  return groups;
}

export function getDailyTotals(
  transactions: Transaction[],
  start: Date,
  end: Date,
): { date: string; income: number; expense: number }[] {
  const days = eachDayOfInterval({ start, end });
  const byDate = groupByDate(transactions);

  return days.map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTransactions = byDate[dateKey] || [];
    return {
      date: dateKey,
      income: sumTransactions(dayTransactions, 'income'),
      expense: sumTransactions(dayTransactions, 'expense'),
    };
  });
}

export function calculatePaceStatus(currentSaved: number, expectedByNow: number): PaceStatus {
  if (currentSaved >= expectedByNow) return 'on-track';
  if (currentSaved >= expectedByNow * 0.85) return 'off-track';
  return 'danger';
}

export function calculateGoalProgress(
  goal: SavingsGoal,
  transactions: Transaction[],
): GoalProgress {
  const today = new Date();
  const startDate = parseISO(goal.startDate);
  const endDate = parseISO(goal.endDate);

  const goalTransactions = filterTransactionsByDateRange(transactions, startDate, today);
  const totalIncome = sumTransactions(goalTransactions, 'income');
  const totalExpenses = sumTransactions(goalTransactions, 'expense');
  const currentSaved = totalIncome - totalExpenses;

  const totalDays = Math.max(differenceInDays(endDate, startDate), 1);
  const elapsedDays = Math.max(differenceInDays(today, startDate), 0);
  const remainingDays = Math.max(totalDays - elapsedDays, 1);
  const remainingAmount = Math.max(goal.targetAmount - currentSaved, 0);

  const requiredDailyRate = remainingAmount / remainingDays;
  const requiredWeeklyRate = requiredDailyRate * 7;
  const requiredMonthlyRate = requiredDailyRate * 30;

  const expectedByNow = (goal.targetAmount / totalDays) * elapsedDays;
  const paceStatus = calculatePaceStatus(currentSaved, expectedByNow);
  const percentComplete = Math.min(Math.max(currentSaved / goal.targetAmount, 0), 1);

  return {
    currentSaved,
    targetAmount: goal.targetAmount,
    totalDays,
    elapsedDays,
    remainingDays,
    remainingAmount,
    requiredDailyRate,
    requiredWeeklyRate,
    requiredMonthlyRate,
    expectedByNow,
    paceStatus,
    percentComplete,
  };
}

export function getTopCategories(
  transactions: Transaction[],
  count: number = 3,
): { category: string; amount: number }[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const byCategory = groupByCategory(expenses);
  return Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, count);
}
