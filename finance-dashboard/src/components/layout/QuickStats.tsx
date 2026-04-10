import { useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency } from '@/lib/formatters';
import { getWeekRange } from '@/lib/calculations';
import { StatusBadge } from '@/components/layout/StatusBadge';

function AnimatedCurrency({ cents, className }: { cents: number; className?: string }) {
  const animated = useAnimatedNumber(cents);
  return <span className={className}>{formatCurrency(Math.round(animated))}</span>;
}

export function QuickStats() {
  const today = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => startOfDay(today), [today]);
  const todayEnd = useMemo(() => endOfDay(today), [today]);
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(today), [today]);

  const todayData = useTransactions(todayStart, todayEnd);
  const weekData = useTransactions(weekStart, weekEnd);
  const progress = useGoalProgress();

  const animatedPercent = useAnimatedNumber(progress.percentComplete * 100);

  return (
    <div className="mx-3 mb-4 rounded-xl bg-bg-secondary border border-border-subtle p-4 space-y-4">
      <p className="text-text-secondary text-xs font-heading font-semibold uppercase tracking-wider">
        Quick Stats
      </p>

      {/* Today's Spending */}
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs font-body">Today's Spending</span>
        <AnimatedCurrency
          cents={todayData.expenses}
          className="font-mono text-sm font-semibold text-accent-red"
        />
      </div>

      {/* This Week divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-text-muted text-[10px] font-body uppercase tracking-wider">This Week</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* Weekly stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-xs font-body">Income</span>
          <AnimatedCurrency
            cents={weekData.income}
            className="font-mono text-sm font-semibold text-accent-green"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-xs font-body">Expenses</span>
          <AnimatedCurrency
            cents={weekData.expenses}
            className="font-mono text-sm font-semibold text-accent-red"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-xs font-body">Net</span>
          <AnimatedCurrency
            cents={weekData.net}
            className={`font-mono text-sm font-semibold ${weekData.net >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
          />
        </div>
      </div>

      {/* Goal divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-text-muted text-[10px] font-body uppercase tracking-wider">Goal</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <AnimatedCurrency
            cents={progress.currentSaved}
            className="font-mono text-accent-green text-sm font-semibold"
          />
          <span className="font-mono text-text-muted text-xs">
            {Math.round(animatedPercent)}%
          </span>
        </div>
        <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-green rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress.percentComplete * 100, 100)}%` }}
          />
        </div>
        <p className="text-text-muted text-xs mt-1 font-body">
          of {formatCurrency(progress.targetAmount)}
        </p>
      </div>

      {/* Pace status */}
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs font-body">Pace</span>
        <StatusBadge status={progress.paceStatus} />
      </div>

      {/* Days remaining */}
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs font-body">Days Remaining</span>
        <span className="font-mono text-sm text-text-secondary font-medium">
          {progress.remainingDays}
        </span>
      </div>
    </div>
  );
}
