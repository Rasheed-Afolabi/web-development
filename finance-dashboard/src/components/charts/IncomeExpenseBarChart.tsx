import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatDayOfWeek, formatCurrency } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface DayData {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseBarChartProps {
  data: DayData[];
}

export function IncomeExpenseBarChart({ data }: IncomeExpenseBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: formatDayOfWeek(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barGap={8}>
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
        <Bar
          dataKey="income"
          name="Income"
          fill="#34D399"
          radius={[6, 6, 0, 0]}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="expense"
          name="Expenses"
          fill="#F87171"
          radius={[6, 6, 0, 0]}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
