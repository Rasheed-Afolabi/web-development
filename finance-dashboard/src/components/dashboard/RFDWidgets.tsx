import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, differenceInDays, parseISO, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { useDebtStore } from '@/stores/useDebtStore';
import { useEnvelopeStore } from '@/stores/useEnvelopeStore';
import { calculateSnowball, calculateAvalanche, calculateSavings } from '@/lib/debt-payoff';
import { INCOME_STREAMS } from '@/data/income-streams';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { detectRecurringBills, calculateMonthlyBurnRate } from '@/lib/recurring-detection';
import { generateForecast, type ForecastDay } from '@/lib/forecast';
import type { IncomeStream, DateRange, ExpenseCategoryGroup, RecurrenceFrequency, AssetType, LiabilityType } from '@/types';
import { useDashboardFilterContext } from '@/contexts/DashboardFilterContext';
import { DeltaIndicator } from './RFDPrimitives';

import {
  RFDCard,
  StatusPill,
  SectionTitle,
  CollapsibleSection,
  Bar,
  Sparkline,
  AnimatedCurrency,
  fmtUSD,
  fmtUSDShort,
} from './RFDPrimitives';

// ---------- Derived computations from real store ----------

interface DayData {
  idx: number;
  label: string;
  date: string; // ISO date
  income: number;
  expense: number;
}

interface DerivedData {
  days: DayData[];
  todayIdx: number;
  weekIncome: number;
  weekExpense: number;
  weekIncomeRealized: number;
  weekExpenseRealized: number;
  weekTargetIncome: number;
  weeklySpendCeiling: number;
  byCat: Record<string, number>;
  byStream: Record<string, number>;
  costOfEarning: { gas: number; fees: number; maint: number; total: number };
  dailyAllowance: number;
  allowanceLeftToday: number;
  allowancePct: number;
  todayIncome: number;
  todayExpense: number;
  net: number;
}

interface FilterParams {
  dateRange?: DateRange;
  incomeStreams?: IncomeStream[] | 'all';
  categoryGroups?: ExpenseCategoryGroup[] | 'all';
}

function useDerived(filters?: FilterParams): DerivedData {
  const transactions = useTransactionStore((s) => s.transactions);
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);
  const allCategories = { ...EXPENSE_CATEGORIES, ...useCategoryStore((s) => s.customCategories) };

  return useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const todayIdx = today.getDay();

    // Determine effective range for bar aggregation
    const effectiveRange = filters?.dateRange ?? { start: weekStart, end: weekEnd };
    const rangeDays = differenceInDays(effectiveRange.end, effectiveRange.start) + 1;
    const useWeeklyAgg = rangeDays > 14;

    // Build day/week structure dynamically
    let days: DayData[];
    if (useWeeklyAgg) {
      const weeks = eachWeekOfInterval({ start: effectiveRange.start, end: effectiveRange.end }, { weekStartsOn: 0 });
      days = weeks.map((w, i) => ({
        idx: i,
        label: format(w, 'MMM d'),
        date: format(w, 'yyyy-MM-dd'),
        income: 0,
        expense: 0,
      }));
    } else {
      const allDays = eachDayOfInterval({ start: effectiveRange.start, end: effectiveRange.end });
      days = allDays.map((d, i) => ({
        idx: i,
        label: format(d, 'EEE'),
        date: format(d, 'yyyy-MM-dd'),
        income: 0,
        expense: 0,
      }));
    }

    let weekIncome = 0;
    let weekExpense = 0;
    let weekIncomeRealized = 0;
    let weekExpenseRealized = 0;
    const byCat: Record<string, number> = {};
    const byStream: Record<string, number> = {};
    const costOfEarning = { gas: 0, fees: 0, maint: 0, total: 0 };

    const rangeStartStr = format(effectiveRange.start, 'yyyy-MM-dd');
    const rangeEndStr = format(effectiveRange.end, 'yyyy-MM-dd');

    transactions.forEach((tx) => {
      if (tx.date < rangeStartStr || tx.date > rangeEndStr) return;

      // Apply income stream filter
      if (tx.type === 'income' && filters?.incomeStreams && filters.incomeStreams !== 'all') {
        if (!tx.incomeStream || !filters.incomeStreams.includes(tx.incomeStream as IncomeStream)) return;
      }

      // Apply category group filter for expenses
      if (tx.type === 'expense' && filters?.categoryGroups && filters.categoryGroups !== 'all') {
        const catDef = allCategories[tx.category];
        if (!catDef || !filters.categoryGroups.includes(catDef.group)) return;
      }

      // Find which bucket this tx belongs to
      let bucketIdx = -1;
      if (useWeeklyAgg) {
        const txWeekStart = format(startOfWeek(parseISO(tx.date), { weekStartsOn: 0 }), 'yyyy-MM-dd');
        bucketIdx = days.findIndex((d) => d.date === txWeekStart);
      } else {
        bucketIdx = days.findIndex((d) => d.date === tx.date);
      }

      const bucket = bucketIdx >= 0 ? days[bucketIdx] : null;

      if (tx.type === 'income') {
        if (bucket) bucket.income += tx.amount;
        weekIncome += tx.amount;
        weekIncomeRealized += tx.amount;
        if (tx.incomeStream) {
          byStream[tx.incomeStream] = (byStream[tx.incomeStream] || 0) + tx.amount;
        }
      } else {
        if (bucket) bucket.expense += tx.amount;
        weekExpense += tx.amount;
        weekExpenseRealized += tx.amount;
        byCat[tx.category] = (byCat[tx.category] || 0) + tx.amount;

        if (tx.category === 'gas-fuel') {
          costOfEarning.gas += tx.amount;
          costOfEarning.total += tx.amount;
        }
        if (tx.category === 'platform-fees') {
          costOfEarning.fees += tx.amount;
          costOfEarning.total += tx.amount;
        }
        if (tx.category === 'car-maintenance') {
          costOfEarning.maint += tx.amount;
          costOfEarning.total += tx.amount;
        }
      }
    });

    // Weekly target income from settings
    const weekTargetIncome = Object.values(weeklyTargets).reduce((s, v) => s + v, 0);

    // Daily allowance: always uses current-week data
    const weeklySpendCeiling = Math.round(weekTargetIncome * 0.7);
    // For allowance, compute from current week transactions regardless of filter
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    let todayExpenses = 0;
    let spentSoFar = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      if (tx.date < weekStartStr || tx.date > weekEndStr) return;
      const txDay = parseISO(tx.date).getDay();
      if (txDay <= todayIdx) spentSoFar += tx.amount;
      if (tx.date === todayStr) todayExpenses += tx.amount;
    });
    const remainingDays = Math.max(1, 7 - todayIdx);
    const allowanceWeek = weeklySpendCeiling - spentSoFar + todayExpenses;
    const dailyAllowance = Math.max(0, Math.round(allowanceWeek / remainingDays));
    const allowanceLeftToday = Math.max(0, dailyAllowance - todayExpenses);
    const allowancePct = dailyAllowance > 0 ? Math.min(100, (todayExpenses / dailyAllowance) * 100) : 0;

    // Find today index in the days array (for non-filtered hero)
    const todayDate = format(today, 'yyyy-MM-dd');
    const displayTodayIdx = days.findIndex((d) => d.date === todayDate);

    return {
      days,
      todayIdx: displayTodayIdx >= 0 ? displayTodayIdx : todayIdx,
      weekIncome,
      weekExpense,
      weekIncomeRealized,
      weekExpenseRealized,
      weekTargetIncome,
      weeklySpendCeiling,
      byCat,
      byStream,
      costOfEarning,
      dailyAllowance,
      allowanceLeftToday,
      allowancePct,
      todayIncome: 0,
      todayExpense: todayExpenses,
      net: weekIncome - weekExpense,
    };
  }, [transactions, weeklyTargets, filters?.dateRange, filters?.incomeStreams, filters?.categoryGroups, allCategories]);
}

function useFilteredDerived() {
  const { dateRange, incomeStreams, categoryGroups, comparison, comparisonRange } = useDashboardFilterContext();
  const current = useDerived({ dateRange, incomeStreams, categoryGroups });
  const previous = useDerived(
    comparison !== 'none' && comparisonRange
      ? { dateRange: comparisonRange, incomeStreams, categoryGroups }
      : undefined
  );
  return { current, previous: comparison !== 'none' ? previous : null };
}

// =========================================================
// 1. DAILY ALLOWANCE HERO
// =========================================================

export function DailyAllowanceHero() {
  const d = useDerived();
  const activeGoal = useGoalStore((s) => s.getActiveGoal());
  const transactions = useTransactionStore((s) => s.transactions);
  const today = new Date();
  const dayName = format(today, 'EEE');
  const dateStr = format(today, 'MMM d');
  const daysLeft = 7 - d.todayIdx;
  const status = d.allowancePct < 70 ? 'on-track' : d.allowancePct < 100 ? 'off-track' : 'danger';
  const verdict =
    status === 'on-track'
      ? "You're under pace today"
      : status === 'off-track'
        ? "Trending close to today's ceiling"
        : "Over today's ceiling";

  // A3 — Safe to Freely Spend guardrails
  const estimatedRecurringDaily = 0; // Will be filled when recurring store exists
  const goalDailyContribution = useMemo(() => {
    if (!activeGoal) return 0;
    const txInRange = transactions.filter((tx) => tx.date >= activeGoal.startDate);
    const inc = txInRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txInRange.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const saved = Math.max(0, inc - exp);
    const remaining = Math.max(0, activeGoal.targetAmount - saved);
    const remainingDays = Math.max(1, differenceInDays(parseISO(activeGoal.endDate), today));
    return Math.round(remaining / remainingDays);
  }, [activeGoal, transactions]);

  const safeToSpend = Math.max(0, d.dailyAllowance - estimatedRecurringDaily - goalDailyContribution);

  return (
    <RFDCard padding="p-7" className="rfd-hero overflow-hidden">
      <div className="absolute inset-0 pointer-events-none rfd-hero-glow" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9898B0] uppercase">
              Today's Allowance
            </p>
            <p className="text-[#7A8BA0] text-xs mt-1 font-mono">
              {dayName} · {dateStr} · {daysLeft} days left in week
            </p>
          </div>
          <StatusPill status={status} size="lg">
            {verdict}
          </StatusPill>
        </div>

        <div className="flex items-end gap-6">
          <div>
            <AnimatedCurrency
              cents={d.allowanceLeftToday}
              className="font-display font-bold text-[64px] leading-none tracking-tight text-[#F0F0F5] tabular-nums"
            />
            <p className="text-[#9898B0] text-sm mt-2">
              left to spend today &nbsp;·&nbsp;
              <span className="text-[#F87171] font-mono">{fmtUSD(d.todayExpense)}</span>
              <span className="text-[#7A8BA0]"> spent of {fmtUSD(d.dailyAllowance)}</span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative h-3 rounded-full bg-[#080B14] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full rfd-bar-fill"
              style={{
                width: `${d.allowancePct}%`,
                background:
                  status === 'on-track' ? '#34D399' : status === 'off-track' ? '#FBBF24' : '#F87171',
              }}
            />
            {[25, 50, 75].map((t) => (
              <span key={t} className="absolute top-0 bottom-0 w-px bg-[#1F2937]" style={{ left: `${t}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#7A8BA0] mt-2 uppercase tracking-wider">
            <span>$0</span>
            <span>{fmtUSDShort(d.dailyAllowance / 2)}</span>
            <span className="text-[#9898B0]">{fmtUSDShort(d.dailyAllowance)} ceiling</span>
          </div>
        </div>

        {/* A3 — Safe to Freely Spend guardrails */}
        {(goalDailyContribution > 0 || estimatedRecurringDaily > 0) && (
          <div className="mt-5 pt-4 border-t border-[#1F2937]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] text-[#7A8BA0] uppercase">
                  Safe to Freely Spend
                </p>
                <div className="flex gap-3 mt-1 text-[10px] font-mono text-[#7A8BA0]">
                  {estimatedRecurringDaily > 0 && (
                    <span>after {fmtUSD(estimatedRecurringDaily)} bills est.</span>
                  )}
                  {goalDailyContribution > 0 && (
                    <span>after {fmtUSD(goalDailyContribution)} goal savings</span>
                  )}
                </div>
              </div>
              <span className="font-display text-2xl font-bold text-[#34D399] tabular-nums">
                {fmtUSD(safeToSpend)}
              </span>
            </div>
          </div>
        )}
      </div>
    </RFDCard>
  );
}

// =========================================================
// 2. CASH FLOW PULSE — 7-day in/out bars
// =========================================================

export function CashFlowPulse() {
  const { current: d, previous } = useFilteredDerived();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = Math.max(...d.days.map((x) => Math.max(x.income, x.expense)), 1);
  const today = d.todayIdx;

  const focused = hoverIdx == null ? today : hoverIdx;
  const fd = d.days[focused];

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="cash-flow-pulse"
        eyebrow="This Week"
        title="Cash Flow Pulse"
        stack
        action={
          <div className="flex gap-3 text-[11px] font-mono text-[#9898B0]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#34D399]" /> In
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#F87171]" /> Out
            </span>
          </div>
        }
      >
        <div className="flex items-end gap-2" style={{ height: '176px' }}>
          {d.days.map((day, i) => {
            const BAR_AREA = 150;
            const inH = (day.income / maxVal) * BAR_AREA;
            const outH = (day.expense / maxVal) * BAR_AREA;
            const isToday = i === today;
            const isFuture = i > today;
            const isFocused = hoverIdx === i || (hoverIdx == null && isToday);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col cursor-pointer group"
                style={{ height: '176px' }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <div className="flex items-end gap-1 relative" style={{ height: `${BAR_AREA}px` }}>
                  <div className="flex-1 flex items-end">
                    <div
                      className="rfd-bar-grow rounded-t-md w-full"
                      style={{
                        height: `${inH}px`,
                        minHeight: day.income > 0 ? '2px' : '0px',
                        background: isFuture
                          ? 'repeating-linear-gradient(45deg, #0E2A1F, #0E2A1F 4px, #12131A 4px, #12131A 8px)'
                          : 'linear-gradient(to top, #0F4F36, #34D399)',
                        animationDelay: `${i * 60}ms`,
                        opacity: isFocused ? 1 : 0.78,
                      }}
                    />
                  </div>
                  <div className="flex-1 flex items-end">
                    <div
                      className="rfd-bar-grow rounded-t-md w-full"
                      style={{
                        height: `${outH}px`,
                        minHeight: day.expense > 0 ? '2px' : '0px',
                        background: isFuture
                          ? 'repeating-linear-gradient(45deg, #2B0F11, #2B0F11 4px, #12131A 4px, #12131A 8px)'
                          : 'linear-gradient(to top, #5C1F23, #F87171)',
                        animationDelay: `${i * 60 + 30}ms`,
                        opacity: isFocused ? 1 : 0.78,
                      }}
                    />
                  </div>
                  {isToday && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8.5px] font-bold tracking-widest text-[#FBBF24]">
                      TODAY
                    </span>
                  )}
                </div>
                <p
                  className={`text-center text-[11px] font-mono mt-2 ${isToday ? 'text-[#F0F0F5]' : isFuture ? 'text-[#7A8BA0]' : 'text-[#9898B0]'}`}
                >
                  {day.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">
              {d.days[focused].label}{' '}
              {focused === today ? '(Today)' : focused > today ? '· Projected' : ''}
            </p>
            <div className="flex gap-5 mt-1">
              <span className="font-mono text-sm text-[#34D399]">+{fmtUSD(fd.income)}</span>
              <span className="font-mono text-sm text-[#F87171]">−{fmtUSD(fd.expense)}</span>
              <span
                className={`font-mono text-sm ${fd.income - fd.expense >= 0 ? 'text-[#F0F0F5]' : 'text-[#F87171]'}`}
              >
                Net {fmtUSD(fd.income - fd.expense)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0] text-right">Period total</p>
            <p className="font-mono text-sm text-[#F0F0F5] mt-1 text-right">
              <span className="text-[#34D399]">+{fmtUSDShort(d.weekIncomeRealized)}</span>
              <span className="text-[#7A8BA0] mx-1.5">/</span>
              <span className="text-[#F87171]">−{fmtUSDShort(d.weekExpenseRealized)}</span>
            </p>
            {previous && (
              <div className="mt-1 text-right">
                <DeltaIndicator currentValue={d.net} previousValue={previous.net} format="currency" />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 3. WEEKLY STREAMS — actual vs target per stream
// =========================================================

export function WeeklyStreams() {
  const { current: d } = useFilteredDerived();
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);

  // Only show streams that have a target or actual income
  const activeStreams = useMemo(() => {
    return Object.entries(INCOME_STREAMS).filter(([key]) => {
      const actual = d.byStream[key] || 0;
      const target = weeklyTargets[key as IncomeStream] || 0;
      return actual > 0 || target > 0;
    });
  }, [d.byStream, weeklyTargets]);

  const totalActual = Object.values(d.byStream).reduce((s, v) => s + v, 0);

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="weekly-streams"
        eyebrow="Income · This Week"
        title="Stream Health"
        stack
        action={<span className="font-mono text-[11px] text-[#9898B0]">vs Weekly Target</span>}
      >
      <div className="space-y-5">
        {activeStreams.map(([key, s]) => {
          const actual = d.byStream[key] || 0;
          const target = weeklyTargets[key as IncomeStream] || 0;
          const pct = target > 0 ? (actual / target) * 100 : actual > 0 ? 100 : 0;
          const status = pct >= 100 ? 'on-track' : pct >= 60 ? 'off-track' : 'danger';
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="text-sm font-medium text-[#F0F0F5] truncate">{s.label}</span>
                </div>
                <span className="font-mono text-xs text-[#F0F0F5] tabular-nums whitespace-nowrap flex-shrink-0">
                  {fmtUSDShort(actual)}
                  {target > 0 && <span className="text-[#7A8BA0]"> / {fmtUSDShort(target)}</span>}
                </span>
              </div>
              <div className="relative h-2 bg-[#080B14] rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rfd-bar-fill rounded-full"
                  style={{ width: `${Math.min(100, pct)}%`, background: s.color }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-mono text-[#7A8BA0]">
                <span>{target > 0 ? `${Math.round(pct)}% of target` : 'No target set'}</span>
                {target > 0 && (
                  <span
                    className={
                      status === 'on-track'
                        ? 'text-[#34D399]'
                        : status === 'off-track'
                          ? 'text-[#FBBF24]'
                          : 'text-[#F87171]'
                    }
                  >
                    {pct >= 100
                      ? `+${fmtUSD(actual - target, 0)} surplus`
                      : `${fmtUSD(target - actual, 0)} to go`}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {activeStreams.length === 0 && (
          <p className="text-sm text-[#7A8BA0]">No income recorded this week. Set targets in Settings.</p>
        )}
      </div>

      {activeStreams.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#1F2937] flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Total</span>
          <span className="font-display text-2xl font-semibold text-[#F0F0F5] tabular-nums">
            {fmtUSD(totalActual, 0)}
            {d.weekTargetIncome > 0 && (
              <span className="text-[#7A8BA0] text-base font-mono"> / {fmtUSD(d.weekTargetIncome, 0)}</span>
            )}
          </span>
        </div>
      )}
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 4. WHERE IT WENT — donut + drill-down list
// =========================================================

export function WhereItWent() {
  const { current: d } = useFilteredDerived();
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const entries = useMemo(() => {
    return Object.entries(d.byCat)
      .map(([key, v]) => ({
        key,
        v,
        label: allCategories[key]?.label || key,
        group: allCategories[key]?.group || 'lifestyle',
        color: allCategories[key]?.color || '#6B7280',
      }))
      .sort((a, b) => b.v - a.v);
  }, [d.byCat, allCategories]);

  const total = entries.reduce((s, e) => s + e.v, 0);
  const [active, setActive] = useState<string | null>(null);
  const activeKey = active || entries[0]?.key || null;

  // Donut math
  const r = 70;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const segments = entries.map((e) => {
    const pct = total > 0 ? e.v / total : 0;
    const seg = { ...e, pct, dash: pct * c, offset: -acc * c };
    acc += pct;
    return seg;
  });

  const activeEntry = entries.find((e) => e.key === activeKey) || entries[0];

  if (entries.length === 0) {
    return (
      <RFDCard>
        <SectionTitle eyebrow="Spending · This Week" title="Where It Went" />
        <p className="text-sm text-[#7A8BA0]">No expenses recorded this week.</p>
      </RFDCard>
    );
  }

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="where-it-went"
        eyebrow="Spending · This Week"
        title="Where It Went"
        action={<span className="font-mono text-[11px] text-[#9898B0]">{entries.length} categories</span>}
      >

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center">
        {/* Donut */}
        <div className="relative aspect-square mx-auto md:mx-0" style={{ maxWidth: '180px' }}>
          <svg viewBox="-100 -100 200 200" className="w-full h-full -rotate-90">
            <circle cx="0" cy="0" r={r} fill="none" stroke="#1A1A24" strokeWidth="22" />
            {segments.map((s, i) => (
              <circle
                key={s.key}
                cx="0"
                cy="0"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={activeKey === s.key ? 26 : 22}
                strokeDasharray={`${s.dash} ${c - s.dash}`}
                strokeDashoffset={s.offset}
                className="rfd-donut-seg cursor-pointer transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
                onMouseEnter={() => setActive(s.key)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[9px] font-semibold tracking-widest text-[#7A8BA0] uppercase leading-none mb-1.5">
              Total Out
            </p>
            <AnimatedCurrency
              cents={total}
              decimals={0}
              className="font-display text-2xl font-bold text-[#F0F0F5] tabular-nums leading-none"
            />
            {d.weekIncome > 0 && (
              <p className="text-[10px] font-mono text-[#9898B0] mt-1.5 leading-none">
                {Math.round((total / d.weekIncome) * 100)}% of in
              </p>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-2 rfd-scroll">
          {entries.map((e) => {
            const isActive = e.key === activeKey;
            return (
              <button
                key={e.key}
                onClick={() => setActive(e.key)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#1A1A24] border-[#2A2A3E]'
                    : 'bg-transparent border-transparent hover:bg-[#15161E]'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: e.color }} />
                <span className="flex-1 text-sm text-[#F0F0F5]">{e.label}</span>
                <span className="text-[10px] font-mono text-[#7A8BA0] w-10 text-right">
                  {total > 0 ? Math.round((e.v / total) * 100) : 0}%
                </span>
                <span className="font-mono text-sm text-[#F0F0F5] tabular-nums w-20 text-right">
                  {fmtUSD(e.v)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeEntry && (
        <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0] mb-1">{activeEntry.group}</p>
            <p className="text-sm text-[#F0F0F5]">
              <span className="font-mono">{fmtUSD(activeEntry.v)}</span>
              <span className="text-[#9898B0]"> on </span>
              <span className="font-medium" style={{ color: activeEntry.color }}>
                {activeEntry.label}
              </span>
            </p>
          </div>
          <div className="w-36">
            <Sparkline
              values={[
                activeEntry.v * 0.6,
                activeEntry.v * 0.9,
                activeEntry.v * 0.7,
                activeEntry.v * 1.1,
                activeEntry.v * 0.85,
                activeEntry.v,
              ]}
              color={activeEntry.color}
              height={28}
            />
            <p className="text-[10px] font-mono text-[#7A8BA0] text-right mt-0.5">6-week trend</p>
          </div>
        </div>
      )}
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 5. COST OF EARNING
// =========================================================

export function CostOfEarning() {
  const { current: d } = useFilteredDerived();
  const c = d.costOfEarning;
  const earningStreams = (d.byStream['delivery'] || 0) + (d.byStream['factory'] || 0);
  const ratio = earningStreams > 0 ? (c.total / earningStreams) * 100 : 0;
  const status: 'on-track' | 'off-track' | 'danger' =
    ratio < 12 ? 'on-track' : ratio < 20 ? 'off-track' : 'danger';

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="cost-of-earning"
        eyebrow="Hustle Costs"
        title="Cost of Earning"
        stack
        action={
          <StatusPill status={status}>
            {ratio.toFixed(1)}% of income
          </StatusPill>
        }
      >
      <div className="space-y-3">
        {[
          { label: 'Gas / Fuel', v: c.gas, color: '#F59E0B' },
          { label: 'Platform Fees', v: c.fees, color: '#B45309' },
          { label: 'Car Maint.', v: c.maint, color: '#D97706' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="text-sm text-[#9898B0] w-32">{row.label}</span>
            <div className="flex-1">
              <Bar pct={(row.v / Math.max(c.total, 1)) * 100} color={row.color} height="h-1.5" />
            </div>
            <span className="font-mono text-sm text-[#F0F0F5] tabular-nums w-16 text-right">
              {fmtUSD(row.v, 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[#1F2937] grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">You spent</p>
          <p className="font-display text-xl font-semibold text-[#F87171] mt-0.5 tabular-nums">
            {fmtUSD(c.total, 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">To earn</p>
          <p className="font-display text-xl font-semibold text-[#34D399] mt-0.5 tabular-nums">
            {fmtUSD(earningStreams, 0)}
          </p>
        </div>
      </div>
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 6. GOALS LIST — from goal store
// =========================================================

export function GoalsList() {
  const goals = useGoalStore((s) => s.goals);
  const [filter, setFilter] = useState('all');
  const transactions = useTransactionStore((s) => s.transactions);

  // Compute saved per goal based on transactions since goal start
  const goalsWithProgress = useMemo(() => {
    return goals.map((g) => {
      const txInRange = transactions.filter((tx) => tx.date >= g.startDate);
      const income = txInRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txInRange.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const saved = Math.max(0, income - expenses);
      const pct = g.targetAmount > 0 ? (saved / g.targetAmount) * 100 : 0;
      const daysLeft = Math.max(0, differenceInDays(parseISO(g.endDate), new Date()));
      return { ...g, saved, pct, daysLeft };
    });
  }, [goals, transactions]);

  const filters = [
    { k: 'all', label: 'All' },
  ];

  const filtered = filter === 'all' ? goalsWithProgress : goalsWithProgress;

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="goals-list"
        eyebrow="Short Horizon"
        title="Goals"
        stack
        action={
          goals.length > 3 ? (
            <div className="flex gap-1 p-1 rounded-lg bg-[#080B14] border border-[#1F2937] flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filter === f.k
                      ? 'bg-[#1F2937] text-[#F0F0F5]'
                      : 'text-[#9898B0] hover:text-[#F0F0F5]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
      <div className="space-y-4">
        {filtered.map((g) => {
          const done = g.pct >= 100;
          return (
            <div key={g.id}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-medium text-[#F0F0F5] flex-1 min-w-0 truncate">
                  {g.name}
                </span>
                {done && (
                  <span className="text-[9px] uppercase tracking-wider text-[#34D399] flex-shrink-0">
                    ✓
                  </span>
                )}
                <span className="font-mono text-[10px] text-[#7A8BA0] flex-shrink-0 whitespace-nowrap">
                  {g.daysLeft}d left
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Bar
                    pct={g.pct}
                    color={done ? '#34D399' : g.pct > 60 ? '#34D399' : g.pct > 30 ? '#FBBF24' : '#F87171'}
                    height="h-1.5"
                  />
                </div>
                <span className="font-mono text-[11px] text-[#F0F0F5] tabular-nums flex-shrink-0 whitespace-nowrap">
                  {fmtUSDShort(g.saved)}
                  <span className="text-[#7A8BA0]"> / {fmtUSDShort(g.targetAmount)}</span>
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-[#7A8BA0]">No goals yet. Create one on the Goals page.</p>
        )}
      </div>
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 7. RECENT ACTIVITY
// =========================================================

export function RecentActivity() {
  const transactions = useTransactionStore((s) => s.transactions);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const items = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [transactions]);

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="recent-activity"
        eyebrow="Activity"
        title="Recent"
        action={
          <a href="#/dashboard" className="text-[11px] text-[#60A5FA] hover:underline">
            view all →
          </a>
        }
      >
      <div className="space-y-1">
        {items.map((t) => {
          const meta =
            t.type === 'income'
              ? INCOME_STREAMS[t.incomeStream as IncomeStream]
              : allCategories[t.category];
          const dayLabel = t.date ? format(parseISO(t.date), 'EEE') : '';
          return (
            <div key={t.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#15161E]">
              <span
                className="h-7 w-7 rounded-md flex items-center justify-center"
                style={{ background: (meta?.color || '#7A8BA0') + '22' }}
              >
                <span className="h-2 w-2 rounded-sm" style={{ background: meta?.color || '#7A8BA0' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F0F0F5] truncate">{meta?.label || t.category || '—'}</p>
                <p className="text-[11px] text-[#7A8BA0] font-mono">
                  {dayLabel}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <span
                className={`font-mono text-sm tabular-nums ${t.type === 'income' ? 'text-[#34D399]' : 'text-[#F87171]'}`}
              >
                {t.type === 'income' ? '+' : '−'}
                {fmtUSD(t.amount)}
              </span>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="text-sm text-[#7A8BA0] py-4 text-center">No transactions yet.</p>
        )}
      </div>
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 8. BIG PICTURE — long-horizon goal view
// =========================================================

interface BigPictureProps {
  visible: boolean;
}

export function BigPicture({ visible }: BigPictureProps) {
  const activeGoal = useGoalStore((s) => s.getActiveGoal());
  const transactions = useTransactionStore((s) => s.transactions);

  const progress = useMemo(() => {
    if (!activeGoal) return null;
    const txInRange = transactions.filter((tx) => tx.date >= activeGoal.startDate);
    const income = txInRange.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txInRange.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const saved = Math.max(0, income - expenses);
    const totalDays = Math.max(1, differenceInDays(parseISO(activeGoal.endDate), parseISO(activeGoal.startDate)));
    const elapsedDays = Math.max(0, differenceInDays(new Date(), parseISO(activeGoal.startDate)));
    const pct = activeGoal.targetAmount > 0 ? (saved / activeGoal.targetAmount) * 100 : 0;
    const expectedPct = (elapsedDays / totalDays) * 100;
    return { saved, pct, expectedPct, target: activeGoal.targetAmount, name: activeGoal.name };
  }, [activeGoal, transactions]);

  if (!visible || !progress) return null;

  const status: 'on-track' | 'off-track' | 'danger' =
    progress.pct >= progress.expectedPct
      ? 'on-track'
      : progress.pct >= progress.expectedPct * 0.85
        ? 'off-track'
        : 'danger';

  return (
    <RFDCard padding="p-7" className="rfd-bigpicture">
      <SectionTitle
        eyebrow="Long horizon · Optional"
        title={`Big Picture — ${progress.name}`}
        action={
          <StatusPill status={status}>
            {status === 'on-track' ? 'On Pace' : status === 'off-track' ? 'Slightly Behind' : 'Falling Behind'}
          </StatusPill>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Saved</p>
          <AnimatedCurrency
            cents={progress.saved}
            decimals={0}
            className="font-display text-3xl font-bold text-[#34D399] tabular-nums"
          />
          <p className="font-mono text-xs text-[#9898B0] mt-1">
            of {fmtUSD(progress.target, 0)} · {Math.round(progress.pct)}%
          </p>
        </div>
        <div>
          <div className="relative h-4 bg-[#080B14] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full rfd-bar-fill"
              style={{
                width: `${Math.min(100, progress.pct)}%`,
                background: 'linear-gradient(to right, #F87171, #FBBF24, #34D399)',
              }}
            />
            <span
              className="absolute top-0 bottom-0 w-px bg-[#9898B0]"
              style={{ left: `${Math.min(100, progress.expectedPct)}%` }}
              title="expected pace"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#7A8BA0] mt-2">
            <span>$0</span>
            <span className="text-[#9898B0]">↑ expected by now</span>
            <span>{fmtUSDShort(progress.target)}</span>
          </div>
        </div>
      </div>
    </RFDCard>
  );
}

// =========================================================
// 9. RECURRING BILLS WIDGET (B1)
// =========================================================

export function RecurringBillsWidget() {
  const bills = useRecurringStore((s) => s.bills);
  const addBill = useRecurringStore((s) => s.addBill);
  const toggleActive = useRecurringStore((s) => s.toggleActive);

  const transactions = useTransactionStore((s) => s.transactions);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFreq, setNewFreq] = useState<RecurrenceFrequency>('monthly');

  const autoDetected = useMemo(() => {
    const existingCats = new Set(bills.map((b) => b.category));
    return detectRecurringBills(transactions, existingCats).filter(
      (c) => !existingCats.has(c.category),
    );
  }, [transactions, bills]);

  const burnRate = calculateMonthlyBurnRate(bills);

  const handleAdd = () => {
    if (!newName || !newAmount) return;
    addBill({
      name: newName,
      amount: Math.round(parseFloat(newAmount) * 100),
      frequency: newFreq,
      category: '',
      nextDueDate: format(new Date(), 'yyyy-MM-dd'),
      isActive: true,
    });
    setNewName('');
    setNewAmount('');
    setShowForm(false);
  };

  if (bills.length === 0 && autoDetected.length === 0) return null;

  const freqBadge: Record<string, string> = {
    weekly: 'W', biweekly: '2W', monthly: 'M', quarterly: 'Q', yearly: 'Y',
  };

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="recurring-bills"
        eyebrow="Subscriptions"
        title="Recurring Bills"
        stack
        action={
          <span className="font-mono text-[11px] text-[#9898B0]">
            {fmtUSD(Math.round(burnRate))}/mo
          </span>
        }
      >
        <div className="space-y-2">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                bill.isActive ? 'bg-[#080B14] border-[#1F2937]' : 'bg-transparent border-transparent opacity-50'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: allCategories[bill.category]?.color || '#60A5FA' }} />
              <span className="flex-1 text-sm text-[#F0F0F5] truncate">{bill.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1F2937] text-[#9898B0]">{freqBadge[bill.frequency] || bill.frequency}</span>
              <span className="font-mono text-sm text-[#F0F0F5] tabular-nums w-20 text-right">{fmtUSD(bill.amount)}</span>
              <button onClick={() => toggleActive(bill.id)} className="text-[10px] text-[#7A8BA0] hover:text-[#9898B0]">
                {bill.isActive ? 'Pause' : 'Resume'}
              </button>
            </div>
          ))}

          {autoDetected.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-[#1E3A6B] bg-[#0F1F36]/50">
              <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0 bg-[#60A5FA]" />
              <span className="flex-1 text-sm text-[#60A5FA] truncate">{allCategories[c.category]?.label || c.name}</span>
              <span className="text-[9px] font-mono text-[#60A5FA]">detected</span>
              <span className="font-mono text-sm text-[#60A5FA] tabular-nums w-20 text-right">{fmtUSD(c.amount)}</span>
              <button onClick={() => addBill({ ...c })} className="text-[10px] text-[#34D399] hover:text-[#4AE3B5]">Accept</button>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="mt-3 p-3 rounded-lg border border-[#1F2937] bg-[#080B14] space-y-2">
            <input className="w-full bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" placeholder="Bill name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
              <input className="flex-1 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="Amount" type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              <select className="bg-[#0D1117] border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" value={newFreq} onChange={(e) => setNewFreq(e.target.value as RecurrenceFrequency)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="text-[11px] font-medium text-[#34D399] hover:text-[#4AE3B5]">Save</button>
              <button onClick={() => setShowForm(false)} className="text-[11px] font-medium text-[#7A8BA0] hover:text-[#9898B0]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="mt-3 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add manually</button>
        )}
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 10. CASH FLOW FORECAST WIDGET (B2)
// =========================================================

export function CashFlowForecastWidget() {
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);
  const transactions = useTransactionStore((s) => s.transactions);
  const recurringBills = useRecurringStore((s) => s.bills);

  const [horizon, setHorizon] = useState<14 | 28>(28);

  const forecast = useMemo((): ForecastDay[] => {
    const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd');
    const recentExpenses = transactions.filter((t) => t.type === 'expense' && t.date >= thirtyDaysAgo).reduce((s, t) => s + t.amount, 0);
    const estimatedDailySpend = Math.round(recentExpenses / 30);
    return generateForecast({ days: horizon, recurringBills, weeklyIncomeTargets: weeklyTargets, estimatedDailySpend, goalDailyContribution: 0 });
  }, [horizon, recurringBills, weeklyTargets, transactions]);

  const projectedNet = forecast[forecast.length - 1]?.cumulative ?? 0;

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="cash-flow-forecast"
        defaultExpanded={false}
        eyebrow="Forward Look"
        title="Cash Flow Forecast"
        stack
        action={
          <div className="flex items-center gap-2">
            {([14, 28] as const).map((d) => (
              <button key={d} onClick={() => setHorizon(d)} className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${horizon === d ? 'bg-[#1F2937] text-[#F0F0F5]' : 'text-[#7A8BA0] hover:text-[#9898B0]'}`}>{d}d</button>
            ))}
          </div>
        }
      >
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Projected net in {horizon} days</p>
          <p className={`font-display text-2xl font-bold tabular-nums ${projectedNet >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
            {projectedNet >= 0 ? '+' : ''}{fmtUSD(Math.round(projectedNet))}
          </p>
        </div>

        <div className="relative h-[120px]">
          <svg viewBox={`0 0 ${forecast.length} 100`} preserveAspectRatio="none" className="w-full h-full">
            {(() => {
              const cumMax = Math.max(...forecast.map((d) => Math.abs(d.cumulative)), 1);
              const points = forecast.map((d, i) => `${i},${50 - (d.cumulative / cumMax) * 45}`).join(' ');
              return (
                <>
                  <polygon points={`0,50 ${points} ${forecast.length - 1},50`} fill={projectedNet >= 0 ? '#34D399' : '#F87171'} opacity="0.08" />
                  <polyline points={points} fill="none" stroke={projectedNet >= 0 ? '#34D399' : '#F87171'} strokeWidth="0.8" />
                </>
              );
            })()}
            <line x1="0" y1="50" x2={forecast.length} y2="50" stroke="#1F2937" strokeWidth="0.3" />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[#7A8BA0] mt-1">
          <span>Today</span>
          <span>{format(new Date(Date.now() + horizon * 86400000), 'MMM d')}</span>
        </div>
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 11. NET WORTH WIDGET (C1)
// =========================================================

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  cash: 'Cash', investment: 'Investments', property: 'Property', vehicle: 'Vehicle', 'other-asset': 'Other',
};
const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  'credit-card': 'Credit Card', 'student-loan': 'Student Loan', mortgage: 'Mortgage',
  'auto-loan': 'Auto Loan', 'personal-loan': 'Personal Loan', 'other-liability': 'Other',
};

export function NetWorthWidget() {
  const entries = useNetWorthStore((s) => s.currentEntries);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const addEntry = useNetWorthStore((s) => s.addEntry);
  const saveSnapshot = useNetWorthStore((s) => s.saveSnapshot);

  const [showAdd, setShowAdd] = useState(false);
  const [addSide, setAddSide] = useState<'asset' | 'liability'>('asset');
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<AssetType | LiabilityType>('cash');
  const [addBalance, setAddBalance] = useState('');

  const assets = entries.filter((e) => e.side === 'asset');
  const liabilities = entries.filter((e) => e.side === 'liability');
  const totalAssets = assets.reduce((s, e) => s + e.balance, 0);
  const totalLiabilities = liabilities.reduce((s, e) => s + e.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const trendValues = useMemo(() => {
    const vals = snapshots.slice(-6).map((s) => s.netWorth);
    if (vals.length < 2 && entries.length > 0) vals.push(netWorth);
    return vals;
  }, [snapshots, netWorth, entries.length]);

  const handleAdd = () => {
    if (!addName || !addBalance) return;
    addEntry({
      name: addName,
      type: addType,
      side: addSide,
      balance: Math.round(parseFloat(addBalance) * 100),
    });
    setAddName('');
    setAddBalance('');
    setShowAdd(false);
  };

  if (entries.length === 0 && !showAdd) {
    return (
      <RFDCard>
        <CollapsibleSection widgetId="net-worth" defaultExpanded={false} eyebrow="Wealth" title="Net Worth">
          <p className="text-sm text-[#7A8BA0]">Track your assets and liabilities.</p>
          <button onClick={() => setShowAdd(true)} className="mt-2 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add first entry</button>
        </CollapsibleSection>
      </RFDCard>
    );
  }

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="net-worth"
        defaultExpanded={false}
        eyebrow="Wealth"
        title="Net Worth"
        stack
        action={
          <button onClick={saveSnapshot} className="text-[10px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">
            Take Snapshot
          </button>
        }
      >
        {/* Hero number */}
        <div className="flex items-baseline gap-3 mb-4">
          <AnimatedCurrency
            cents={netWorth}
            decimals={0}
            className={`font-display text-3xl font-bold tabular-nums ${netWorth >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}
          />
          {trendValues.length >= 2 && (
            <div className="w-24">
              <Sparkline values={trendValues} color={netWorth >= 0 ? '#34D399' : '#F87171'} height={20} />
            </div>
          )}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#34D399] mb-2">Assets · {fmtUSDShort(totalAssets)}</p>
            <div className="space-y-1.5">
              {assets.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded bg-[#080B14]">
                  <span className="text-[12px] text-[#F0F0F5] truncate">{e.name}</span>
                  <span className="font-mono text-[12px] text-[#34D399] tabular-nums">{fmtUSDShort(e.balance)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#F87171] mb-2">Liabilities · {fmtUSDShort(totalLiabilities)}</p>
            <div className="space-y-1.5">
              {liabilities.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded bg-[#080B14]">
                  <span className="text-[12px] text-[#F0F0F5] truncate">{e.name}</span>
                  <span className="font-mono text-[12px] text-[#F87171] tabular-nums">{fmtUSDShort(e.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inline add */}
        {showAdd ? (
          <div className="mt-3 p-3 rounded-lg border border-[#1F2937] bg-[#080B14] space-y-2">
            <div className="flex gap-2">
              {(['asset', 'liability'] as const).map((s) => (
                <button key={s} onClick={() => { setAddSide(s); setAddType(s === 'asset' ? 'cash' : 'credit-card'); }}
                  className={`text-[11px] px-2 py-0.5 rounded ${addSide === s ? 'bg-[#1F2937] text-[#F0F0F5]' : 'text-[#7A8BA0]'}`}>{s}</button>
              ))}
            </div>
            <input className="w-full bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" placeholder="Name" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <div className="flex gap-2">
              <select className="bg-[#0D1117] border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" value={addType} onChange={(e) => setAddType(e.target.value as AssetType | LiabilityType)}>
                {addSide === 'asset'
                  ? Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)
                  : Object.entries(LIABILITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className="flex-1 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="Balance" type="number" step="0.01" value={addBalance} onChange={(e) => setAddBalance(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="text-[11px] font-medium text-[#34D399]">Save</button>
              <button onClick={() => setShowAdd(false)} className="text-[11px] font-medium text-[#7A8BA0]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="mt-3 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add entry</button>
        )}
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 12. DEBT PAYOFF WIDGET (C2+C3)
// =========================================================

export function DebtPayoffWidget() {
  const debts = useDebtStore((s) => s.debts);
  const addDebt = useDebtStore((s) => s.addDebt);

  const [method, setMethod] = useState<'snowball' | 'avalanche'>('avalanche');
  const [extraPayment, setExtraPayment] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBalance, setAddBalance] = useState('');
  const [addApr, setAddApr] = useState('');
  const [addMin, setAddMin] = useState('');

  const extraCents = Math.round((parseFloat(extraPayment) || 0) * 100);

  const result = useMemo(() => {
    if (debts.length === 0) return null;
    return method === 'snowball' ? calculateSnowball(debts, extraCents) : calculateAvalanche(debts, extraCents);
  }, [debts, method, extraCents]);

  const savings = useMemo(() => {
    if (debts.length === 0 || extraCents <= 0) return null;
    return calculateSavings(debts, extraCents, method);
  }, [debts, extraCents, method]);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const avgApr = debts.length > 0 ? debts.reduce((s, d) => s + d.apr, 0) / debts.length : 0;

  const handleAddDebt = () => {
    if (!addName || !addBalance || !addApr || !addMin) return;
    addDebt({
      name: addName,
      type: 'credit-card',
      balance: Math.round(parseFloat(addBalance) * 100),
      apr: parseFloat(addApr),
      minimumPayment: Math.round(parseFloat(addMin) * 100),
    });
    setAddName(''); setAddBalance(''); setAddApr(''); setAddMin('');
    setShowAdd(false);
  };

  if (debts.length === 0 && !showAdd) {
    return (
      <RFDCard>
        <CollapsibleSection widgetId="debt-payoff" defaultExpanded={false} eyebrow="Debt" title="Debt Payoff">
          <p className="text-sm text-[#7A8BA0]">Add debts to see payoff strategies.</p>
          <button onClick={() => setShowAdd(true)} className="mt-2 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add first debt</button>
        </CollapsibleSection>
      </RFDCard>
    );
  }

  const monthColor = (m: number) => m < 24 ? 'text-[#34D399]' : m < 60 ? 'text-[#FBBF24]' : 'text-[#F87171]';

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="debt-payoff"
        defaultExpanded={false}
        eyebrow="Debt Strategy"
        title="Debt Payoff"
        stack
        action={
          <div className="flex gap-1 p-0.5 rounded-lg bg-[#080B14] border border-[#1F2937]">
            {(['snowball', 'avalanche'] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md capitalize transition-colors ${method === m ? 'bg-[#1F2937] text-[#F0F0F5]' : 'text-[#7A8BA0]'}`}>{m}</button>
            ))}
          </div>
        }
      >
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Total Debt</p>
            <p className="font-display text-lg font-bold text-[#F87171] tabular-nums">{fmtUSD(totalDebt, 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Avg APR</p>
            <p className="font-mono text-lg font-bold text-[#FBBF24] tabular-nums">{avgApr.toFixed(1)}%</p>
          </div>
          {result && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Debt-free in</p>
              <p className={`font-display text-lg font-bold tabular-nums ${monthColor(result.totalMonths)}`}>
                {result.totalMonths} mo
              </p>
            </div>
          )}
        </div>

        {/* Per-debt rows */}
        <div className="space-y-2">
          {debts.map((d) => {
            const pct = totalDebt > 0 ? (d.balance / totalDebt) * 100 : 0;
            return (
              <div key={d.id} className="px-3 py-2 rounded-lg bg-[#080B14] border border-[#1F2937]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#F0F0F5]">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2B0F11] text-[#F87171]">{d.apr}%</span>
                    <span className="font-mono text-sm text-[#F0F0F5] tabular-nums">{fmtUSD(d.balance)}</span>
                  </div>
                </div>
                <Bar pct={pct} color="#F87171" height="h-1" />
              </div>
            );
          })}
        </div>

        {/* Extra payment input */}
        <div className="mt-4 pt-3 border-t border-[#1F2937]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#9898B0]">Extra/mo:</span>
            <input
              className="w-24 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono"
              placeholder="$0"
              type="number"
              step="10"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
            />
            {savings && savings.monthsSaved > 0 && (
              <span className="text-[11px] font-mono text-[#34D399]">
                Save {fmtUSD(savings.interestSaved, 0)} interest · {savings.monthsSaved} mo faster
              </span>
            )}
          </div>
        </div>

        {/* Add debt form */}
        {showAdd ? (
          <div className="mt-3 p-3 rounded-lg border border-[#1F2937] bg-[#080B14] space-y-2">
            <input className="w-full bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" placeholder="Debt name" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <div className="flex gap-2">
              <input className="flex-1 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="Balance" type="number" value={addBalance} onChange={(e) => setAddBalance(e.target.value)} />
              <input className="w-20 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="APR%" type="number" step="0.1" value={addApr} onChange={(e) => setAddApr(e.target.value)} />
              <input className="w-24 bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="Min/mo" type="number" value={addMin} onChange={(e) => setAddMin(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddDebt} className="text-[11px] font-medium text-[#34D399]">Save</button>
              <button onClick={() => setShowAdd(false)} className="text-[11px] font-medium text-[#7A8BA0]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="mt-3 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add debt</button>
        )}
      </CollapsibleSection>
    </RFDCard>
  );
}

// =========================================================
// 13. ENVELOPE BUDGET WIDGET (D1)
// =========================================================

const ENVELOPE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#14B8A6', '#EAB308', '#F97316', '#0EA5E9'];

export function EnvelopeDashboardWidget() {
  const buckets = useEnvelopeStore((s) => s.buckets);
  const periodStart = useEnvelopeStore((s) => s.periodStart);
  const addBucket = useEnvelopeStore((s) => s.addBucket);
  const resetPeriod = useEnvelopeStore((s) => s.resetPeriod);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState('');

  // Derive spent per bucket from transactions since period start
  const bucketSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    const expenses = transactions.filter((t) => t.type === 'expense' && t.date >= periodStart);
    for (const bucket of buckets) {
      if (bucket.category) {
        spending[bucket.id] = expenses
          .filter((t) => t.category === bucket.category)
          .reduce((s, t) => s + t.amount, 0);
      } else {
        spending[bucket.id] = 0;
      }
    }
    return spending;
  }, [buckets, transactions, periodStart]);

  const totalAllocated = buckets.reduce((s, b) => s + b.allocated, 0);

  // Calculate unallocated income
  const periodIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && t.date >= periodStart)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, periodStart]);
  const unallocated = periodIncome - totalAllocated;

  const handleAdd = () => {
    if (!addName || !addAmount) return;
    addBucket({
      name: addName,
      allocated: Math.round(parseFloat(addAmount) * 100),
      color: ENVELOPE_COLORS[buckets.length % ENVELOPE_COLORS.length],
    });
    setAddName('');
    setAddAmount('');
    setShowAdd(false);
  };

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="envelope-budget"
        eyebrow="Envelope Budget"
        title="Where It Goes"
        stack
        action={
          <button onClick={resetPeriod} className="text-[10px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">
            Reset Period
          </button>
        }
      >
        <div className="space-y-3">
          {buckets.map((bucket) => {
            const spent = bucketSpending[bucket.id] || 0;
            const pct = bucket.allocated > 0 ? (spent / bucket.allocated) * 100 : 0;
            const remaining = bucket.allocated - spent;
            const isOver = remaining < 0;
            return (
              <div key={bucket.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bucket.color }} />
                    <span className="text-sm text-[#F0F0F5]">{bucket.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
                    <span className={isOver ? 'text-[#F87171]' : 'text-[#9898B0]'}>{fmtUSD(spent)}</span>
                    <span className="text-[#7A8BA0]">/</span>
                    <span className="text-[#F0F0F5]">{fmtUSD(bucket.allocated)}</span>
                  </div>
                </div>
                <Bar pct={pct} color={isOver ? '#F87171' : bucket.color} height="h-1.5" />
                <div className="flex justify-between text-[10px] font-mono mt-0.5">
                  <span className={isOver ? 'text-[#F87171]' : 'text-[#7A8BA0]'}>
                    {isOver ? `${fmtUSD(Math.abs(remaining))} over` : `${fmtUSD(remaining)} left`}
                  </span>
                  <span className="text-[#7A8BA0]">{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: unallocated */}
        {buckets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1F2937] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[#7A8BA0]">Unallocated</span>
            <span className={`font-mono text-sm tabular-nums ${unallocated >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
              {fmtUSD(unallocated)}
            </span>
          </div>
        )}

        {showAdd ? (
          <div className="mt-3 p-3 rounded-lg border border-[#1F2937] bg-[#080B14] space-y-2">
            <input className="w-full bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5]" placeholder="Envelope name" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <input className="w-full bg-transparent border border-[#1F2937] rounded px-2 py-1 text-sm text-[#F0F0F5] font-mono" placeholder="Budget amount" type="number" step="0.01" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="text-[11px] font-medium text-[#34D399]">Save</button>
              <button onClick={() => setShowAdd(false)} className="text-[11px] font-medium text-[#7A8BA0]">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="mt-3 text-[11px] font-medium text-[#60A5FA] hover:text-[#93C5FD]">+ Add Envelope</button>
        )}
      </CollapsibleSection>
    </RFDCard>
  );
}
