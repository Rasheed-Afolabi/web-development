import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { INCOME_STREAMS } from '@/data/income-streams';
import { formatCurrency } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface IncomeStreamBreakdownProps {
  data: Record<string, number>; // streamId -> amount in cents
}

export function IncomeStreamBreakdown({ data }: IncomeStreamBreakdownProps) {
  const chartData = Object.entries(data).map(([id, amount]) => ({
    name: INCOME_STREAMS[id as keyof typeof INCOME_STREAMS]?.label || id,
    value: amount,
    color: INCOME_STREAMS[id as keyof typeof INCOME_STREAMS]?.color || '#6B7280',
  }));

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" barSize={24}>
        <XAxis
          type="number"
          tick={{ fill: '#8492A6', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#4E5D78', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]} animationDuration={800}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
