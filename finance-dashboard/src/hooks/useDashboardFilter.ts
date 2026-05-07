import { useState, useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  subWeeks,
  differenceInMilliseconds,
} from 'date-fns';
import type { TimeRangePreset, DateRange, ComparisonMode, IncomeStream, ExpenseCategoryGroup } from '@/types';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { parseISO } from 'date-fns';

export function useDashboardFilter() {
  const [preset, setPreset] = useState<TimeRangePreset>('this-month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[] | 'all'>('all');
  const [categoryGroups, setCategoryGroups] = useState<ExpenseCategoryGroup[] | 'all'>('all');
  const [comparison, setComparison] = useState<ComparisonMode>('none');
  const transactions = useTransactionStore((s) => s.transactions);

  const dateRange = useMemo<DateRange>(() => {
    const now = new Date();
    switch (preset) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'this-week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month': {
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case 'all-time': {
        if (transactions.length === 0) {
          return { start: startOfMonth(now), end: endOfDay(now) };
        }
        const dates = transactions.map((t) => parseISO(t.date));
        const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
        return { start: startOfDay(earliest), end: endOfDay(now) };
      }
      case 'custom':
        return customRange ?? { start: startOfMonth(now), end: endOfDay(now) };
    }
  }, [preset, customRange, transactions]);

  const comparisonRange = useMemo<DateRange | null>(() => {
    if (comparison === 'none') return null;

    const now = new Date();
    switch (preset) {
      case 'today':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'this-week':
        return {
          start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
          end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        };
      case 'this-month': {
        const prev = subMonths(now, 1);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
      case 'last-month': {
        const prev = subMonths(now, 2);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
      default: {
        // Custom or all-time: shift by duration
        const duration = differenceInMilliseconds(dateRange.end, dateRange.start);
        const prevEnd = new Date(dateRange.start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
      }
    }
  }, [comparison, preset, dateRange]);

  return {
    preset,
    setPreset,
    dateRange,
    customRange,
    setCustomRange,
    incomeStreams,
    setIncomeStreams,
    categoryGroups,
    setCategoryGroups,
    comparison,
    setComparison,
    comparisonRange,
  };
}

export type DashboardFilterReturn = ReturnType<typeof useDashboardFilter>;
