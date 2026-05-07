import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, differenceInDays, parseISO } from 'date-fns';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { INCOME_STREAMS } from '@/data/income-streams';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { useCategoryStore } from '@/stores/useCategoryStore';
import type { IncomeStream } from '@/types';

import {
  RFDCard,
  StatusPill,
  SectionTitle,
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

function useDerived(): DerivedData {
  const transactions = useTransactionStore((s) => s.transactions);
  const weeklyTargets = useSettingsStore((s) => s.weeklyIncomeTargets);

  return useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const todayIdx = today.getDay(); // 0=Sun, 1=Mon, ...

    // Build 7-day structure
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: DayData[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return {
        idx: i,
        label: dayLabels[i],
        date: format(d, 'yyyy-MM-dd'),
        income: 0,
        expense: 0,
      };
    });

    let weekIncome = 0;
    let weekExpense = 0;
    let weekIncomeRealized = 0;
    let weekExpenseRealized = 0;
    const byCat: Record<string, number> = {};
    const byStream: Record<string, number> = {};
    const costOfEarning = { gas: 0, fees: 0, maint: 0, total: 0 };

    // Filter transactions to this week
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    transactions.forEach((tx) => {
      if (tx.date < weekStartStr || tx.date > weekEndStr) return;

      const txDate = parseISO(tx.date);
      const dayOfWeek = txDate.getDay();
      const d = days[dayOfWeek];
      if (!d) return;

      if (tx.type === 'income') {
        d.income += tx.amount;
        weekIncome += tx.amount;
        weekIncomeRealized += tx.amount;
        if (tx.incomeStream) {
          byStream[tx.incomeStream] = (byStream[tx.incomeStream] || 0) + tx.amount;
        }
      } else {
        d.expense += tx.amount;
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

    // Daily allowance: weekly target ceiling (70% of income target) minus expenses-so-far
    const weeklySpendCeiling = Math.round(weekTargetIncome * 0.7);
    const spentSoFar = days.slice(0, todayIdx + 1).reduce((s, d) => s + d.expense, 0);
    const todayExpenses = days[todayIdx]?.expense ?? 0;
    const remainingDays = Math.max(1, 7 - todayIdx);
    const allowanceWeek = weeklySpendCeiling - spentSoFar + todayExpenses;
    const dailyAllowance = Math.max(0, Math.round(allowanceWeek / remainingDays));
    const allowanceLeftToday = Math.max(0, dailyAllowance - todayExpenses);
    const allowancePct = dailyAllowance > 0 ? Math.min(100, (todayExpenses / dailyAllowance) * 100) : 0;

    return {
      days,
      todayIdx,
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
      todayIncome: days[todayIdx]?.income ?? 0,
      todayExpense: todayExpenses,
      net: weekIncome - weekExpense,
    };
  }, [transactions, weeklyTargets]);
}

// =========================================================
// 1. DAILY ALLOWANCE HERO
// =========================================================

export function DailyAllowanceHero() {
  const d = useDerived();
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

  return (
    <RFDCard padding="p-7" className="rfd-hero overflow-hidden">
      <div className="absolute inset-0 pointer-events-none rfd-hero-glow" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9898B0] uppercase">
              Today's Allowance
            </p>
            <p className="text-[#5A5A72] text-xs mt-1 font-mono">
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
              <span className="text-[#5A5A72]"> spent of {fmtUSD(d.dailyAllowance)}</span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative h-3 rounded-full bg-[#0A0A12] overflow-hidden">
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
          <div className="flex justify-between text-[10px] font-mono text-[#5A5A72] mt-2 uppercase tracking-wider">
            <span>$0</span>
            <span>{fmtUSDShort(d.dailyAllowance / 2)}</span>
            <span className="text-[#9898B0]">{fmtUSDShort(d.dailyAllowance)} ceiling</span>
          </div>
        </div>
      </div>
    </RFDCard>
  );
}

// =========================================================
// 2. CASH FLOW PULSE — 7-day in/out bars
// =========================================================

export function CashFlowPulse() {
  const d = useDerived();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = Math.max(...d.days.map((x) => Math.max(x.income, x.expense)), 1);
  const today = d.todayIdx;

  const focused = hoverIdx == null ? today : hoverIdx;
  const fd = d.days[focused];

  return (
    <RFDCard>
      <SectionTitle
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
      />

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
                className={`text-center text-[11px] font-mono mt-2 ${isToday ? 'text-[#F0F0F5]' : isFuture ? 'text-[#5A5A72]' : 'text-[#9898B0]'}`}
              >
                {day.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A72]">
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
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A72] text-right">Week to date</p>
          <p className="font-mono text-sm text-[#F0F0F5] mt-1 text-right">
            <span className="text-[#34D399]">+{fmtUSDShort(d.weekIncomeRealized)}</span>
            <span className="text-[#5A5A72] mx-1.5">/</span>
            <span className="text-[#F87171]">−{fmtUSDShort(d.weekExpenseRealized)}</span>
          </p>
        </div>
      </div>
    </RFDCard>
  );
}

// =========================================================
// 3. WEEKLY STREAMS — actual vs target per stream
// =========================================================

export function WeeklyStreams() {
  const d = useDerived();
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
      <SectionTitle
        eyebrow="Income · This Week"
        title="Stream Health"
        stack
        action={<span className="font-mono text-[11px] text-[#9898B0]">vs Weekly Target</span>}
      />

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
                  {target > 0 && <span className="text-[#5A5A72]"> / {fmtUSDShort(target)}</span>}
                </span>
              </div>
              <div className="relative h-2 bg-[#0A0A12] rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rfd-bar-fill rounded-full"
                  style={{ width: `${Math.min(100, pct)}%`, background: s.color }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-mono text-[#5A5A72]">
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
          <p className="text-sm text-[#5A5A72]">No income recorded this week. Set targets in Settings.</p>
        )}
      </div>

      {activeStreams.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#1F2937] flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#5A5A72]">Total</span>
          <span className="font-display text-2xl font-semibold text-[#F0F0F5] tabular-nums">
            {fmtUSD(totalActual, 0)}
            {d.weekTargetIncome > 0 && (
              <span className="text-[#5A5A72] text-base font-mono"> / {fmtUSD(d.weekTargetIncome, 0)}</span>
            )}
          </span>
        </div>
      )}
    </RFDCard>
  );
}

// =========================================================
// 4. WHERE IT WENT — donut + drill-down list
// =========================================================

export function WhereItWent() {
  const d = useDerived();
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
        <p className="text-sm text-[#5A5A72]">No expenses recorded this week.</p>
      </RFDCard>
    );
  }

  return (
    <RFDCard>
      <SectionTitle
        eyebrow="Spending · This Week"
        title="Where It Went"
        action={<span className="font-mono text-[11px] text-[#9898B0]">{entries.length} categories</span>}
      />

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
            <p className="text-[9px] font-semibold tracking-widest text-[#5A5A72] uppercase leading-none mb-1.5">
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
                <span className="text-[10px] font-mono text-[#5A5A72] w-10 text-right">
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
            <p className="text-[10px] uppercase tracking-widest text-[#5A5A72] mb-1">{activeEntry.group}</p>
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
            <p className="text-[10px] font-mono text-[#5A5A72] text-right mt-0.5">6-week trend</p>
          </div>
        </div>
      )}
    </RFDCard>
  );
}

// =========================================================
// 5. COST OF EARNING
// =========================================================

export function CostOfEarning() {
  const d = useDerived();
  const c = d.costOfEarning;
  const earningStreams = (d.byStream['delivery'] || 0) + (d.byStream['factory'] || 0);
  const ratio = earningStreams > 0 ? (c.total / earningStreams) * 100 : 0;
  const status: 'on-track' | 'off-track' | 'danger' =
    ratio < 12 ? 'on-track' : ratio < 20 ? 'off-track' : 'danger';

  return (
    <RFDCard>
      <SectionTitle
        eyebrow="Hustle Costs"
        title="Cost of Earning"
        stack
        action={
          <StatusPill status={status}>
            {ratio.toFixed(1)}% of income
          </StatusPill>
        }
      />
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
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A72]">You spent</p>
          <p className="font-display text-xl font-semibold text-[#F87171] mt-0.5 tabular-nums">
            {fmtUSD(c.total, 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A72]">To earn</p>
          <p className="font-display text-xl font-semibold text-[#34D399] mt-0.5 tabular-nums">
            {fmtUSD(earningStreams, 0)}
          </p>
        </div>
      </div>
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
      <SectionTitle
        eyebrow="Short Horizon"
        title="Goals"
        stack
        action={
          goals.length > 3 ? (
            <div className="flex gap-1 p-1 rounded-lg bg-[#0A0A12] border border-[#1F2937] flex-wrap">
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
      />
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
                <span className="font-mono text-[10px] text-[#5A5A72] flex-shrink-0 whitespace-nowrap">
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
                  <span className="text-[#5A5A72]"> / {fmtUSDShort(g.targetAmount)}</span>
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-[#5A5A72]">No goals yet. Create one on the Goals page.</p>
        )}
      </div>
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
      <SectionTitle
        eyebrow="Activity"
        title="Recent"
        action={
          <a href="#/dashboard" className="text-[11px] text-[#60A5FA] hover:underline">
            view all →
          </a>
        }
      />
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
                style={{ background: (meta?.color || '#5A5A72') + '22' }}
              >
                <span className="h-2 w-2 rounded-sm" style={{ background: meta?.color || '#5A5A72' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F0F0F5] truncate">{meta?.label || t.category || '—'}</p>
                <p className="text-[11px] text-[#5A5A72] font-mono">
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
          <p className="text-sm text-[#5A5A72] py-4 text-center">No transactions yet.</p>
        )}
      </div>
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
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A72]">Saved</p>
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
          <div className="relative h-4 bg-[#0A0A12] rounded-full overflow-hidden">
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
          <div className="flex justify-between text-[10px] font-mono text-[#5A5A72] mt-2">
            <span>$0</span>
            <span className="text-[#9898B0]">↑ expected by now</span>
            <span>{fmtUSDShort(progress.target)}</span>
          </div>
        </div>
      </div>
    </RFDCard>
  );
}
