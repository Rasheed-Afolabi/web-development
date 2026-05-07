import { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Layer } from 'recharts';
import { buildSankeyData, groupByIncomeStream, groupByCategoryGroup } from '@/lib/calculations';
import { INCOME_STREAMS } from '@/data/income-streams';
import { CATEGORY_GROUPS } from '@/data/expense-categories';
import { formatCurrency } from '@/lib/formatters';
import type { Transaction } from '@/types';

interface SankeyFlowChartProps {
  transactions: Transaction[];
}

const GROUP_LABELS: Record<string, string> = {};
for (const g of CATEGORY_GROUPS) {
  GROUP_LABELS[g.id] = g.label;
}

const NODE_COLORS: Record<string, string> = {
  'Total Income': '#60A5FA',
  essentials: '#EF4444',
  'earning-costs': '#F59E0B',
  lifestyle: '#8B5CF6',
  growth: '#3B82F6',
  commitments: '#059669',
};
for (const [id, stream] of Object.entries(INCOME_STREAMS)) {
  NODE_COLORS[id] = stream.color;
}

function getNodeLabel(name: string): string {
  if (INCOME_STREAMS[name as keyof typeof INCOME_STREAMS]) {
    return INCOME_STREAMS[name as keyof typeof INCOME_STREAMS].label;
  }
  return GROUP_LABELS[name] || name;
}

function SankeyNode({ x, y, width, height, payload }: {
  x: number; y: number; width: number; height: number;
  payload: { name: string; value: number };
}) {
  const color = NODE_COLORS[payload.name] || '#6B7280';
  const label = getNodeLabel(payload.name);
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill={color} opacity={0.85} radius={[4, 4, 4, 4]} />
      {height > 14 && (
        <text
          x={x + width + 6}
          y={y + height / 2}
          textAnchor="start"
          dominantBaseline="central"
          fill="#9898B0"
          fontSize={10}
          fontFamily="DM Sans"
        >
          {label}
        </text>
      )}
    </Layer>
  );
}

function SankeyTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: { source: string; target: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 shadow-md">
      <p className="text-text-primary text-xs font-body">
        {getNodeLabel(data.source)} → {getNodeLabel(data.target)}
      </p>
      <p className="text-accent-blue text-sm font-mono font-semibold">
        {formatCurrency(data.value * 100)}
      </p>
    </div>
  );
}

export function SankeyFlowChart({ transactions }: SankeyFlowChartProps) {
  const sankeyData = useMemo(() => {
    const byStream = groupByIncomeStream(transactions);
    const byGroup = groupByCategoryGroup(transactions.filter((t) => t.type === 'expense'));
    return buildSankeyData(byStream, byGroup);
  }, [transactions]);

  if (sankeyData.links.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <Sankey
        data={sankeyData}
        nodeWidth={12}
        nodePadding={24}
        margin={{ left: 10, right: 120, top: 10, bottom: 10 }}
        link={{ stroke: '#4A4A6A', strokeOpacity: 0.4 }}
        node={<SankeyNode x={0} y={0} width={0} height={0} payload={{ name: '', value: 0 }} />}
      >
        <Tooltip content={<SankeyTooltipContent />} />
      </Sankey>
    </ResponsiveContainer>
  );
}
