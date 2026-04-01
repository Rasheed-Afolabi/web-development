import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { formatCurrency } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';

interface CategoryDonutChartProps {
  data: Record<string, number>;
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const chartData = Object.entries(data)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({
      name: allCategories[id]?.label || id,
      value: amount,
      color: allCategories[id]?.color || '#6B7280',
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) return null;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-mono font-bold text-xl text-text-primary">{formatCurrency(total)}</p>
          <p className="text-text-muted text-xs font-body">Total</p>
        </div>
      </div>
    </div>
  );
}
