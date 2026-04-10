import { useMemo, useState } from 'react';
import { format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatDisplay } from '@/components/dashboard/StatDisplay';
import { StatusBadge } from '@/components/layout/StatusBadge';
import { IncomeExpenseBarChart } from '@/components/charts/IncomeExpenseBarChart';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';
import { WeeklySpendingBars } from '@/components/charts/WeeklySpendingBars';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { groupByCategoryGroup } from '@/lib/calculations';
import { eachDayOfInterval, format as fmtDate } from 'date-fns';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { filterTransactionsByDateRange } from '@/lib/calculations';

export function WeeklyView() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const review = useWeeklyReview(referenceDate);
  const progress = useGoalProgress();
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);
  const totalWeeklyTarget = Object.values(weeklyTargets).reduce((a, b) => a + b, 0);
  const allTransactions = useTransactionStore((s) => s.transactions);

  const TrendIcon = review.weekOverWeekTrend === 'up' ? TrendingUp
    : review.weekOverWeekTrend === 'down' ? TrendingDown
    : Minus;

  const trendColor = review.weekOverWeekTrend === 'up' ? 'text-accent-green'
    : review.weekOverWeekTrend === 'down' ? 'text-accent-red'
    : 'text-text-muted';

  const hasData = review.transactions.length > 0;

  // Build stacked daily category group data
  const weeklyGroupData = useMemo(() => {
    const days = eachDayOfInterval({ start: review.weekStart, end: review.weekEnd });
    return days.map((day) => {
      const dateKey = fmtDate(day, 'yyyy-MM-dd');
      const dayTxns = filterTransactionsByDateRange(allTransactions, day, day)
        .filter((t) => t.type === 'expense');
      const groups = groupByCategoryGroup(dayTxns);
      return { date: dateKey, ...groups };
    });
  }, [review.weekStart, review.weekEnd, allTransactions]);

  // Top 3 spending categories
  const topCategories = review.topCategories.slice(0, 3);

  // Weekly savings progress
  const weeklySavings = review.income - review.expenses;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-heading font-bold text-2xl text-text-primary">Weekly Review</h2>
            <StatusBadge status={progress.paceStatus} />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReferenceDate((d) => subWeeks(d, 1))}
              className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-text-secondary" />
            </button>
            <p className="text-text-secondary text-sm font-body">
              {formatDate(format(review.weekStart, 'yyyy-MM-dd'), 'MMM d')} — {formatDate(format(review.weekEnd, 'yyyy-MM-dd'), 'MMM d, yyyy')}
            </p>
            <button
              onClick={() => setReferenceDate((d) => addWeeks(d, 1))}
              className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-text-secondary" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon size={20} className={trendColor} />
          <span className={`text-sm font-body ${trendColor}`}>
            {review.weekOverWeekTrend === 'up' ? 'Improved' : review.weekOverWeekTrend === 'down' ? 'Declined' : 'Steady'} vs last week
          </span>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="No data for this week"
          description="Start by adding income and expense transactions on the Daily view."
        />
      ) : (
        <div className="space-y-6">
          {/* Stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataCard index={0}>
              <StatDisplay label="Income" value={review.income} colorClass="text-accent-green" />
            </DataCard>
            <DataCard index={1}>
              <StatDisplay label="Expenses" value={review.expenses} colorClass="text-accent-red" />
            </DataCard>
            <DataCard index={2}>
              <StatDisplay label="Net Savings" value={weeklySavings} />
            </DataCard>
            <DataCard index={3}>
              {totalWeeklyTarget > 0 ? (
                <div>
                  <p className="text-text-secondary text-xs font-body mb-1">vs Target</p>
                  <p className={`font-mono font-bold text-2xl ${review.income >= totalWeeklyTarget ? 'text-accent-green' : 'text-accent-amber'}`}>
                    {formatCurrency(review.income - totalWeeklyTarget)}
                  </p>
                  <p className="text-text-muted text-xs font-body mt-1">
                    Target: {formatCurrency(totalWeeklyTarget)}
                  </p>
                </div>
              ) : (
                <StatDisplay label="Daily Average" value={Math.round(review.expenses / 7)} colorClass="text-accent-amber" />
              )}
            </DataCard>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard index={4}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Income vs Expenses</h3>
              <IncomeExpenseBarChart data={review.dailyTotals} />
            </DataCard>
            <DataCard index={5}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Spending by Category</h3>
              <CategoryDonutChart data={review.byCategory} />
            </DataCard>
          </div>

          {/* Category spending + Top categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DataCard index={6}>
                <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Daily Spending by Group</h3>
                <WeeklySpendingBars data={weeklyGroupData} />
              </DataCard>
            </div>
            <DataCard index={7}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Top Spending</h3>
              <div className="space-y-4">
                {topCategories.map(({ category, amount }, i) => {
                  const cat = EXPENSE_CATEGORIES[category];
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-text-muted text-sm">#{i + 1}</span>
                        <div>
                          <p className="text-text-primary text-sm font-body">{cat?.label || category}</p>
                          <div
                            className="h-1 rounded-full mt-1"
                            style={{
                              width: `${(amount / topCategories[0].amount) * 100}%`,
                              backgroundColor: cat?.color || '#6B7280',
                              minWidth: '20px',
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm text-accent-red font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Savings this week */}
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <p className="text-text-secondary text-xs font-body mb-2">Savings this week</p>
                <p className={`font-mono font-bold text-xl ${weeklySavings >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatCurrency(weeklySavings)}
                </p>
                {totalWeeklyTarget > 0 && (
                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-accent-green rounded-full transition-all"
                      style={{ width: `${Math.min(Math.max(weeklySavings / (totalWeeklyTarget * 0.3) * 100, 0), 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </DataCard>
          </div>
        </div>
      )}
    </div>
  );
}
