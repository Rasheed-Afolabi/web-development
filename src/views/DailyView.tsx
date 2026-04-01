import { useMemo } from 'react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatDisplay } from '@/components/dashboard/StatDisplay';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatCurrency } from '@/lib/formatters';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

export function DailyView() {
  const today = useMemo(() => new Date(), []);
  const dayStart = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);
  const dayEnd = useMemo(() => {
    const d = new Date(today);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [today]);

  const { transactions, income, expenses, net, byCategory } = useTransactions(dayStart, dayEnd);
  const progress = useGoalProgress();
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);

  const totalWeeklyTarget = Object.values(weeklyTargets).reduce((a, b) => a + b, 0);
  const dailyBudget = totalWeeklyTarget > 0 ? Math.round(totalWeeklyTarget / 7) : 0;
  const remaining = dailyBudget - expenses;
  const animatedRemaining = useAnimatedNumber(remaining);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Daily Snapshot</h2>
          <p className="text-text-secondary text-sm font-body mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Stats + Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataCard index={0}>
              <StatDisplay label="Today's Spending" value={expenses} colorClass="text-accent-red" size="sm" />
            </DataCard>
            <DataCard index={1}>
              <StatDisplay label="Today's Income" value={income} colorClass="text-accent-green" size="sm" />
            </DataCard>
            <DataCard index={2}>
              <StatDisplay label="Net" value={net} size="sm" />
            </DataCard>
            <DataCard index={3}>
              {dailyBudget > 0 ? (
                <div>
                  <p className="text-text-secondary text-xs font-body mb-1">Remaining Today</p>
                  <span className={`font-mono font-bold text-lg ${remaining >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatCurrency(Math.round(animatedRemaining))}
                  </span>
                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${remaining >= 0 ? 'bg-accent-green' : 'bg-accent-red'}`}
                      style={{ width: `${Math.min(Math.max((1 - expenses / dailyBudget) * 100, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-text-secondary text-xs font-body mb-1">Daily Budget</p>
                  <span className="text-text-muted text-sm font-body">Set targets in Settings</span>
                </div>
              )}
            </DataCard>
          </div>

          {/* Mini category donut */}
          {Object.keys(byCategory).length > 0 && (
            <DataCard index={4}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Today&apos;s Categories</h3>
              <CategoryDonutChart data={byCategory} />
            </DataCard>
          )}

          {/* Transaction list */}
          <DataCard index={5}>
            <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Today&apos;s Transactions</h3>
            {transactions.length > 0 ? (
              <TransactionList transactions={transactions} groupDates={false} />
            ) : (
              <EmptyState
                title="No transactions today"
                description="Add your first transaction to start tracking."
              />
            )}
          </DataCard>
        </div>

        {/* Right column: Quick Add Form */}
        <div className="space-y-6">
          <DataCard index={2}>
            <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Quick Add</h3>
            <TransactionForm />
          </DataCard>

          <DataCard index={3}>
            <p className="text-text-muted text-xs font-body mb-1">Goal Progress</p>
            <p className="font-mono font-bold text-lg text-accent-green">
              {formatCurrency(progress.currentSaved)}
            </p>
            <div className="w-full h-2 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full transition-all duration-1000"
                style={{ width: `${progress.percentComplete * 100}%` }}
              />
            </div>
            <p className="text-text-muted text-xs mt-1 font-body">
              {formatCurrency(progress.targetAmount)} target
            </p>
          </DataCard>
        </div>
      </div>
    </div>
  );
}
