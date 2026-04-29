import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface TrendData {
  date: string;
  cumulative: number;
}

interface MonthlyTrendLineProps {
  data: TrendData[];
}

export function MonthlyTrendLine({ data }: MonthlyTrendLineProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#8492A6', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#8492A6', fontSize: 12, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Cumulative Spend"
          stroke="#60A5FA"
          strokeWidth={2.5}
          fill="url(#trendGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#60A5FA', stroke: '#FFFFFF', strokeWidth: 2 }}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
