import { useMemo } from 'react';
import { format, eachMonthOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useGoalStore } from '@/stores/useGoalStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatDisplay } from '@/components/dashboard/StatDisplay';
import { StatusBadge } from '@/components/layout/StatusBadge';
import { SavingsThermometer } from '@/components/charts/SavingsThermometer';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { filterTransactionsByDateRange, sumTransactions } from '@/lib/calculations';
import { MILESTONES } from '@/data/constants';
import { Check, Circle } from 'lucide-react';

export function GoalView() {
  const progress = useGoalProgress();
  const goal = useGoalStore();
  const transactions = useTransactionStore((s) => s.transactions);

  // Waterfall data: net savings per month
  const waterfallData = useMemo(() => {
    const start = parseISO(goal.startDate);
    const end = new Date() < parseISO(goal.endDate) ? new Date() : parseISO(goal.endDate);
    if (start > end) return [];

    const months = eachMonthOfInterval({ start, end });
    return months.map((month) => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const txns = filterTransactionsByDateRange(transactions, mStart, mEnd);
      const income = sumTransactions(txns, 'income');
      const expenses = sumTransactions(txns, 'expense');
      return {
        month: format(month, 'MMM'),
        savings: income - expenses,
      };
    });
  }, [goal.startDate, goal.endDate, transactions]);

  // Projected completion based on current rate
  const projectedDate = useMemo(() => {
    if (progress.elapsedDays === 0 || progress.currentSaved <= 0) return null;
    const dailyRate = progress.currentSaved / progress.elapsedDays;
    if (dailyRate <= 0) return null;
    const daysNeeded = progress.targetAmount / dailyRate;
    const projected = new Date(parseISO(goal.startDate));
    projected.setDate(projected.getDate() + Math.ceil(daysNeeded));
    return projected;
  }, [progress, goal.startDate]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-heading font-bold text-2xl text-text-primary">Goal Tracker</h2>
            <StatusBadge status={progress.paceStatus} />
          </div>
          <p className="text-text-secondary text-sm font-body">
            {formatDate(goal.startDate)} — {formatDate(goal.endDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thermometer - Center Stage */}
        <div className="lg:col-span-2">
          <DataCard index={0} className="flex justify-center">
            <SavingsThermometer
              currentSaved={progress.currentSaved}
              targetAmount={progress.targetAmount}
              paceStatus={progress.paceStatus}
            />
          </DataCard>
        </div>

        {/* Stats column */}
        <div className="space-y-4">
          <DataCard index={1}>
            <StatDisplay label="Saved So Far" value={progress.currentSaved} size="lg" colorClass="text-accent-green" />
          </DataCard>
          <DataCard index={2}>
            <StatDisplay label="Remaining" value={progress.remainingAmount} size="md" colorClass="text-accent-amber" />
          </DataCard>
          <DataCard index={3}>
            <div>
              <p className="text-text-secondary text-xs font-body mb-1">Gap to Goal</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per day</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredDailyRate))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per week</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredWeeklyRate))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per month</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredMonthlyRate))}</span>
                </div>
              </div>
            </div>
          </DataCard>
          <DataCard index={4}>
            <p className="text-text-secondary text-xs font-body mb-1">Projected Completion</p>
            {projectedDate ? (
              <p className="font-heading font-semibold text-lg text-text-primary">
                {format(projectedDate, 'MMM d, yyyy')}
              </p>
            ) : (
              <p className="text-text-muted text-sm font-body">Not enough data yet</p>
            )}
            <p className="text-text-muted text-xs font-body mt-1">
              {progress.remainingDays} days remaining
            </p>
          </DataCard>
        </div>
      </div>

      {/* Waterfall + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <DataCard index={5}>
          <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Monthly Savings</h3>
          {waterfallData.length > 0 ? (
            <WaterfallChart data={waterfallData} />
          ) : (
            <p className="text-text-muted text-sm font-body">Savings data will appear here as months pass.</p>
          )}
        </DataCard>

        <DataCard index={6}>
          <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Milestones</h3>
          <div className="space-y-3">
            {MILESTONES.map((milestone) => {
              const reached = progress.currentSaved >= milestone;
              return (
                <div key={milestone} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    reached ? 'bg-accent-green-dim' : 'bg-bg-tertiary'
                  }`}>
                    {reached ? (
                      <Check size={14} className="text-accent-green" />
                    ) : (
                      <Circle size={14} className="text-text-muted" />
                    )}
                  </div>
                  <span className={`font-mono text-sm ${reached ? 'text-accent-green' : 'text-text-muted'}`}>
                    {formatCurrency(milestone)}
                  </span>
                  {reached && (
                    <span className="text-accent-green text-xs font-body">Reached!</span>
                  )}
                </div>
              );
            })}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
