import { formatCurrency } from '@/lib/formatters';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 shadow-lg">
      {label && <p className="text-text-muted text-xs mb-1 font-body">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary text-xs font-body">{entry.name}:</span>
          <span className="text-text-primary text-xs font-mono font-semibold">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
