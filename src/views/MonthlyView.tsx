import { useMemo, useState } from 'react';
import { format, subMonths, addMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatDisplay } from '@/components/dashboard/StatDisplay';
import { MonthlyTrendLine } from '@/components/charts/MonthlyTrendLine';
import { MonthComparisonBars } from '@/components/charts/MonthComparisonBars';
import { IncomeStreamBreakdown } from '@/components/charts/IncomeStreamBreakdown';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { filterTransactionsByDateRange, sumTransactions } from '@/lib/calculations';

export function MonthlyView() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const monthStart = useMemo(() => startOfMonth(referenceDate), [referenceDate]);
  const monthEnd = useMemo(() => endOfMonth(referenceDate), [referenceDate]);

  const { transactions, income, expenses, net, byCategory, byIncomeStream } = useTransactions(monthStart, monthEnd);
  const allTransactions = useTransactionStore((s) => s.transactions);

  // Cumulative spend trend
  const trendData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: new Date() < monthEnd ? new Date() : monthEnd });
    let cumulative = 0;
    return days.map((day) => {
      const dayTxns = filterTransactionsByDateRange(allTransactions, day, day);
      cumulative += sumTransactions(dayTxns, 'expense');
      return { date: format(day, 'yyyy-MM-dd'), cumulative };
    });
  }, [monthStart, monthEnd, allTransactions]);

  // Last 3 months comparison
  const monthComparison = useMemo(() => {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const m = subMonths(referenceDate, i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const txns = filterTransactionsByDateRange(allTransactions, start, end);
      months.push({
        month: format(m, 'MMM'),
        income: sumTransactions(txns, 'income'),
        expense: sumTransactions(txns, 'expense'),
      });
    }
    return months;
  }, [referenceDate, allTransactions]);

  // Projected month-end
  const daysElapsed = useMemo(() => {
    const now = new Date();
    const end = now < monthEnd ? now : monthEnd;
    return eachDayOfInterval({ start: monthStart, end }).length;
  }, [monthStart, monthEnd]);

  const totalDaysInMonth = useMemo(() =>
    eachDayOfInterval({ start: monthStart, end: monthEnd }).length
  , [monthStart, monthEnd]);

  const projectedExpenses = daysElapsed > 0
    ? Math.round((expenses / daysElapsed) * totalDaysInMonth)
    : 0;
  const projectedIncome = daysElapsed > 0
    ? Math.round((income / daysElapsed) * totalDaysInMonth)
    : 0;

  const hasData = transactions.length > 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Monthly Overview</h2>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => setReferenceDate((d) => subMonths(d, 1))}
              className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-text-secondary" />
            </button>
            <p className="text-text-secondary text-sm font-body">
              {format(referenceDate, 'MMMM yyyy')}
            </p>
            <button
              onClick={() => setReferenceDate((d) => addMonths(d, 1))}
              className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="No data for this month"
          description="Start adding transactions to see your monthly overview."
        />
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataCard index={0}>
              <StatDisplay label="Income" value={income} colorClass="text-accent-green" />
            </DataCard>
            <DataCard index={1}>
              <StatDisplay label="Expenses" value={expenses} colorClass="text-accent-red" />
            </DataCard>
            <DataCard index={2}>
              <StatDisplay label="Net Savings" value={net} />
            </DataCard>
            <DataCard index={3}>
              <div>
                <p className="text-text-secondary text-xs font-body mb-1">Projected End</p>
                <p className="font-mono font-bold text-xl text-accent-blue">
                  {formatCurrency(projectedIncome - projectedExpenses)}
                </p>
                <p className="text-text-muted text-xs font-body mt-1">net savings</p>
              </div>
            </DataCard>
          </div>

          {/* Trend + Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard index={4}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Cumulative Spending</h3>
              <MonthlyTrendLine data={trendData} />
            </DataCard>
            <DataCard index={5}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Month Comparison</h3>
              <MonthComparisonBars data={monthComparison} />
            </DataCard>
          </div>

          {/* Income streams + Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard index={6}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Income Streams</h3>
              {Object.keys(byIncomeStream).length > 0 ? (
                <IncomeStreamBreakdown data={byIncomeStream} />
              ) : (
                <p className="text-text-muted text-sm font-body">No income recorded this month</p>
              )}
            </DataCard>
            <DataCard index={7}>
              <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Category Breakdown</h3>
              <CategoryDonutChart data={byCategory} />
            </DataCard>
          </div>
        </div>
      )}
    </div>
  );
}
