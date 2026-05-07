import { useMemo } from 'react';
import { format, subWeeks, startOfWeek, addDays, parseISO, isWithinInterval } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import type { Transaction } from '@/types';

interface SpendingHeatmapProps {
  transactions: Transaction[];
}

function getIntensity(amount: number, max: number): string {
  if (amount === 0) return 'bg-bg-tertiary';
  const ratio = amount / max;
  if (ratio < 0.25) return 'bg-accent-green/20';
  if (ratio < 0.5) return 'bg-accent-amber/30';
  if (ratio < 0.75) return 'bg-accent-amber/60';
  return 'bg-accent-red/70';
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export function SpendingHeatmap({ transactions }: SpendingHeatmapProps) {
  const { grid, monthLabels, maxAmount } = useMemo(() => {
    const now = new Date();
    const weeksBack = 26;
    const weekStart = startOfWeek(subWeeks(now, weeksBack - 1), { weekStartsOn: 1 });

    // Build daily spending map
    const dailySpend: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        dailySpend[t.date] = (dailySpend[t.date] || 0) + t.amount;
      }
    }

    // Build grid: weeks x 7 days
    const grid: { date: string; amount: number; inRange: boolean }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = '';

    for (let w = 0; w < weeksBack; w++) {
      const week: { date: string; amount: number; inRange: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, w * 7 + d);
        const key = format(day, 'yyyy-MM-dd');
        const inRange = isWithinInterval(day, { start: weekStart, end: now });
        week.push({ date: key, amount: dailySpend[key] || 0, inRange });

        if (d === 0) {
          const month = format(day, 'MMM');
          if (month !== lastMonth) {
            monthLabels.push({ label: month, col: w });
            lastMonth = month;
          }
        }
      }
      grid.push(week);
    }

    const maxAmount = Math.max(...Object.values(dailySpend), 1);
    return { grid, monthLabels, maxAmount };
  }, [transactions]);

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="text-text-muted text-[10px] font-body absolute"
            style={{ left: `${m.col * 14 + 32}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 mt-5 relative">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[12px] text-text-muted text-[9px] font-body flex items-center justify-end w-6">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[12px] h-[12px] rounded-[2px] ${
                  day.inRange ? getIntensity(day.amount, maxAmount) : 'bg-transparent'
                }`}
                title={day.inRange ? `${format(parseISO(day.date), 'MMM d')}: ${formatCurrency(day.amount)}` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 ml-8">
        <span className="text-text-muted text-[10px] font-body mr-1">Less</span>
        <div className="w-[12px] h-[12px] rounded-[2px] bg-bg-tertiary" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-accent-green/20" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-accent-amber/30" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-accent-amber/60" />
        <div className="w-[12px] h-[12px] rounded-[2px] bg-accent-red/70" />
        <span className="text-text-muted text-[10px] font-body ml-1">More</span>
      </div>
    </div>
  );
}
