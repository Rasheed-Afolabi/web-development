import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { INCOME_STREAMS } from '@/data/income-streams';
import { useCategoryStore } from '@/stores/useCategoryStore';
import type { Transaction } from '@/types';

interface InsightCardProps {
  transactions: Transaction[];
  income: number;
  expenses: number;
}

export function InsightCard({ transactions, income, expenses }: InsightCardProps) {
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const insights = useMemo(() => {
    const result: { text: string; color: string }[] = [];

    // Top expense category
    const expenseTxns = transactions.filter((t) => t.type === 'expense');
    const byCat: Record<string, number> = {};
    for (const t of expenseTxns) {
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    }
    const topCat = Object.entries(byCat).sort(([, a], [, b]) => b - a)[0];
    if (topCat) {
      const label = allCategories[topCat[0]]?.label || topCat[0];
      result.push({
        text: `Your top expense is ${label} at ${formatCurrency(topCat[1])}`,
        color: 'text-accent-amber',
      });
    }

    // Savings rate
    if (income > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      if (savingsRate > 0) {
        result.push({
          text: `You're saving ${savingsRate.toFixed(0)}% of your income`,
          color: savingsRate >= 20 ? 'text-accent-green' : 'text-accent-amber',
        });
      } else {
        result.push({
          text: `You're spending more than you earn this period`,
          color: 'text-accent-red',
        });
      }
    }

    // Top income stream
    const incomeTxns = transactions.filter((t) => t.type === 'income' && t.incomeStream);
    const byStream: Record<string, number> = {};
    for (const t of incomeTxns) {
      if (t.incomeStream) byStream[t.incomeStream] = (byStream[t.incomeStream] || 0) + t.amount;
    }
    const topStream = Object.entries(byStream).sort(([, a], [, b]) => b - a)[0];
    if (topStream) {
      const label = INCOME_STREAMS[topStream[0] as keyof typeof INCOME_STREAMS]?.label || topStream[0];
      result.push({
        text: `Top earner: ${label} at ${formatCurrency(topStream[1])}`,
        color: 'text-accent-green',
      });
    }

    // Transaction count
    if (transactions.length > 0) {
      result.push({
        text: `${transactions.length} transactions in this period`,
        color: 'text-accent-blue',
      });
    }

    return result;
  }, [transactions, income, expenses, allCategories]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
          <Lightbulb size={16} className={`${insight.color} shrink-0 mt-0.5`} />
          <p className={`text-sm font-body ${insight.color}`}>{insight.text}</p>
        </div>
      ))}
    </div>
  );
}
