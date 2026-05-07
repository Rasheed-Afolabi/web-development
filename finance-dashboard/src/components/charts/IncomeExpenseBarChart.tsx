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

function formatLabel(date: string): string {
  // If it looks like an ISO date (yyyy-MM-dd), format as day of week
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return formatDayOfWeek(date);
  }
  // Otherwise it's already a formatted label (e.g. "May 5" from weekly aggregation)
  return date;
}

export function IncomeExpenseBarChart({ data }: IncomeExpenseBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: formatLabel(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="day"
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
