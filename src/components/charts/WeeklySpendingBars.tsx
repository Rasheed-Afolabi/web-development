import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatDayOfWeek, formatCurrency } from '@/lib/formatters';
import type { ExpenseCategoryGroup } from '@/types';
import { CATEGORY_GROUPS } from '@/data/expense-categories';
import { ChartTooltip } from './ChartTooltip';

interface DayGroupData {
  date: string;
  essentials: number;
  'earning-costs': number;
  lifestyle: number;
  growth: number;
  commitments: number;
}

interface WeeklySpendingBarsProps {
  data: DayGroupData[];
}

const GROUP_COLORS: Record<ExpenseCategoryGroup, string> = {
  essentials: '#EF4444',
  'earning-costs': '#F59E0B',
  lifestyle: '#06B6D4',
  growth: '#3B82F6',
  commitments: '#059669',
};

export function WeeklySpendingBars({ data }: WeeklySpendingBarsProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: formatDayOfWeek(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: '#5A5A72', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#5A5A72', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans', color: '#9898B0' }}
        />
        {CATEGORY_GROUPS.map(({ id }) => (
          <Bar
            key={id}
            dataKey={id}
            name={CATEGORY_GROUPS.find((g) => g.id === id)?.label || id}
            stackId="spending"
            fill={GROUP_COLORS[id]}
            radius={id === 'commitments' ? [6, 6, 0, 0] : undefined}
            animationDuration={800}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
