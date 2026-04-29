import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface MonthData {
  month: string;
  income: number;
  expense: number;
}

interface MonthComparisonBarsProps {
  data: MonthData[];
}

export function MonthComparisonBars({ data }: MonthComparisonBarsProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
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
        <Bar
          dataKey="income"
          name="Income"
          fill="#34D399"
          radius={[6, 6, 0, 0]}
          animationDuration={800}
        />
        <Bar
          dataKey="expense"
          name="Expenses"
          fill="#F87171"
          radius={[6, 6, 0, 0]}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
