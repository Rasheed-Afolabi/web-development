import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface WaterfallData {
  month: string;
  savings: number; // net savings for that month (can be negative)
}

interface WaterfallChartProps {
  data: WaterfallData[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fill: d.savings >= 0 ? '#34D399' : '#F87171',
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#8492A6', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8492A6', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="savings" name="Net Savings" radius={[6, 6, 0, 0]} animationDuration={800}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
