import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { formatCurrency } from '@/lib/formatters';

interface CategoryTreemapProps {
  data: Record<string, number>;
}

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
  value: number;
}

function CustomContent({ x, y, width, height, name, color }: TreemapContentProps) {
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={4} opacity={0.85} />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F0F0F5"
        fontSize={width < 80 ? 9 : 11}
        fontFamily="DM Sans"
        fontWeight={500}
      >
        {name.length > (width / 7) ? name.slice(0, Math.floor(width / 7)) + '…' : name}
      </text>
    </g>
  );
}

function TreemapTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 shadow-md">
      <p className="text-text-primary text-xs font-body font-medium">{item.name}</p>
      <p className="text-accent-blue text-sm font-mono font-semibold">{formatCurrency(item.value)}</p>
    </div>
  );
}

export function CategoryTreemap({ data }: CategoryTreemapProps) {
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

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <Treemap
        data={chartData}
        dataKey="value"
        nameKey="name"
        content={<CustomContent x={0} y={0} width={0} height={0} name="" color="" value={0} />}
        animationDuration={800}
      >
        <Tooltip content={<TreemapTooltipContent />} />
      </Treemap>
    </ResponsiveContainer>
  );
}
