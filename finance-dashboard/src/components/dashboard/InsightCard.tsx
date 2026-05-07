import { useMemo } from 'react';
import { Lightbulb, TrendingDown, TrendingUp, Flame, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { INCOME_STREAMS } from '@/data/income-streams';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useDashboardFilterContext } from '@/contexts/DashboardFilterContext';
import { RFDCard, CollapsibleSection } from './RFDPrimitives';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import type { IncomeStream, Transaction } from '@/types';

function getFilteredTransactions(
  transactions: Transaction[],
  startStr: string,
  endStr: string,
): Transaction[] {
  return transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);
}

export function InsightCard() {
  const { dateRange } = useDashboardFilterContext();
  const transactions = useTransactionStore((s) => s.transactions);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };
  const activeGoal = useGoalStore((s) => s.getActiveGoal());

  const insights = useMemo(() => {
    const result: { text: string; color: string; icon: 'bulb' | 'up' | 'down' | 'flame' | 'warn' }[] = [];

    const startStr = format(dateRange.start, 'yyyy-MM-dd');
    const endStr = format(dateRange.end, 'yyyy-MM-dd');
    const current = getFilteredTransactions(transactions, startStr, endStr);

    const income = current.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = current.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Build category totals
    const byCat: Record<string, number> = {};
    const byStream: Record<string, number> = {};
    for (const t of current) {
      if (t.type === 'expense') byCat[t.category] = (byCat[t.category] || 0) + t.amount;
      if (t.type === 'income' && t.incomeStream) byStream[t.incomeStream] = (byStream[t.incomeStream] || 0) + t.amount;
    }

    // 1. Top expense category
    const topCat = Object.entries(byCat).sort(([, a], [, b]) => b - a)[0];
    if (topCat) {
      const label = allCategories[topCat[0]]?.label || topCat[0];
      result.push({
        text: `Your top expense is ${label} at ${formatCurrency(topCat[1])}`,
        color: 'text-[#FBBF24]',
        icon: 'bulb',
      });
    }

    // 2. Savings rate
    if (income > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      if (savingsRate > 0) {
        result.push({
          text: `You're saving ${savingsRate.toFixed(0)}% of your income`,
          color: savingsRate >= 20 ? 'text-[#34D399]' : 'text-[#FBBF24]',
          icon: 'up',
        });
      } else {
        result.push({
          text: `You're spending more than you earn this period`,
          color: 'text-[#F87171]',
          icon: 'down',
        });
      }
    }

    // 3. Top income stream
    const topStream = Object.entries(byStream).sort(([, a], [, b]) => b - a)[0];
    if (topStream) {
      const label = INCOME_STREAMS[topStream[0] as IncomeStream]?.label || topStream[0];
      result.push({
        text: `Top earner: ${label} at ${formatCurrency(topStream[1])}`,
        color: 'text-[#34D399]',
        icon: 'up',
      });
    }

    // 4. Transaction count
    if (current.length > 0) {
      result.push({
        text: `${current.length} transactions in this period`,
        color: 'text-[#60A5FA]',
        icon: 'bulb',
      });
    }

    // --- 4 new insights (5-8) ---

    // 5. Spending pace alert vs previous period
    const rangeDays = Math.max(1, differenceInDays(dateRange.end, dateRange.start) + 1);
    const prevStart = format(subDays(dateRange.start, rangeDays), 'yyyy-MM-dd');
    const prevEnd = format(subDays(dateRange.start, 1), 'yyyy-MM-dd');
    const previous = getFilteredTransactions(transactions, prevStart, prevEnd);
    const prevExpenses = previous.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    if (prevExpenses > 0 && expenses > 0) {
      const pctChange = ((expenses - prevExpenses) / prevExpenses) * 100;
      if (pctChange > 15) {
        result.push({
          text: `Spending is up ${Math.round(pctChange)}% vs previous period`,
          color: 'text-[#F87171]',
          icon: 'warn',
        });
      } else if (pctChange < -10) {
        result.push({
          text: `Spending is down ${Math.abs(Math.round(pctChange))}% vs previous period`,
          color: 'text-[#34D399]',
          icon: 'up',
        });
      }
    }

    // 6. Category spike — any category >50% higher than previous period
    if (prevExpenses > 0) {
      const prevByCat: Record<string, number> = {};
      for (const t of previous) {
        if (t.type === 'expense') prevByCat[t.category] = (prevByCat[t.category] || 0) + t.amount;
      }
      for (const [cat, amt] of Object.entries(byCat)) {
        const prev = prevByCat[cat] || 0;
        if (prev > 0 && amt > prev * 1.5 && amt > 500) { // >$5 and >50% spike
          const label = allCategories[cat]?.label || cat;
          result.push({
            text: `${label} spiked ${Math.round(((amt - prev) / prev) * 100)}% vs last period`,
            color: 'text-[#FBBF24]',
            icon: 'warn',
          });
          break; // only show one spike
        }
      }
    }

    // 7. Spending streak — consecutive days with expenses
    const expenseDates = new Set(current.filter((t) => t.type === 'expense').map((t) => t.date));
    if (expenseDates.size > 0) {
      const sortedDates = [...expenseDates].sort();
      let maxStreak = 1;
      let streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]));
        if (diff === 1) { streak++; maxStreak = Math.max(maxStreak, streak); }
        else streak = 1;
      }
      if (maxStreak >= 5) {
        result.push({
          text: `${maxStreak}-day spending streak this period`,
          color: maxStreak >= 7 ? 'text-[#F87171]' : 'text-[#FBBF24]',
          icon: 'flame',
        });
      }
    }

    // 8. Goal danger warning
    if (activeGoal) {
      const txInRange = transactions.filter((tx) => tx.date >= activeGoal.startDate);
      const goalIncome = txInRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const goalExpenses = txInRange.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const saved = Math.max(0, goalIncome - goalExpenses);
      const totalDays = Math.max(1, differenceInDays(parseISO(activeGoal.endDate), parseISO(activeGoal.startDate)));
      const elapsed = Math.max(0, differenceInDays(new Date(), parseISO(activeGoal.startDate)));
      const expectedByNow = (activeGoal.targetAmount / totalDays) * elapsed;
      if (elapsed > 7 && saved < expectedByNow * 0.85 && saved < activeGoal.targetAmount) {
        result.push({
          text: `"${activeGoal.name}" is falling behind — save more to catch up`,
          color: 'text-[#F87171]',
          icon: 'warn',
        });
      }
    }

    return result;
  }, [transactions, dateRange, allCategories, activeGoal]);

  if (insights.length === 0) return null;

  const iconMap = {
    bulb: <Lightbulb size={14} />,
    up: <TrendingUp size={14} />,
    down: <TrendingDown size={14} />,
    flame: <Flame size={14} />,
    warn: <AlertTriangle size={14} />,
  };

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="smart-insights"
        eyebrow="AI-Powered"
        title="Smart Insights"
        action={<span className="font-mono text-[11px] text-[#9898B0]">{insights.length} insights</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#080B14] border border-[#1F2937]"
            >
              <span className={`${insight.color} shrink-0 mt-0.5`}>{iconMap[insight.icon]}</span>
              <p className={`text-[12px] font-medium leading-snug ${insight.color}`}>{insight.text}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </RFDCard>
  );
}
