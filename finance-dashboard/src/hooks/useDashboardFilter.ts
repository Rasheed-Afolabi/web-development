import { useState, useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import type { TimeRangePreset, DateRange } from '@/types';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { parseISO } from 'date-fns';

export function useDashboardFilter() {
  const [preset, setPreset] = useState<TimeRangePreset>('this-month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
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

  return {
    preset,
    setPreset,
    dateRange,
    customRange,
    setCustomRange,
  };
}
