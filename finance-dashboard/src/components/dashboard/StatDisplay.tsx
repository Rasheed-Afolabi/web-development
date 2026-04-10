import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency } from '@/lib/formatters';

interface StatDisplayProps {
  label: string;
  value: number; // in cents
  trend?: 'up' | 'down' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
}

export function StatDisplay({ label, value, trend, size = 'md', colorClass }: StatDisplayProps) {
  const animatedValue = useAnimatedNumber(value);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const resolvedColor = colorClass || (value >= 0 ? 'text-accent-green' : 'text-accent-red');

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-accent-red' : 'text-text-muted';

  return (
    <div>
      <p className="text-text-secondary text-xs font-body mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${sizeClasses[size]} ${resolvedColor}`}>
          {formatCurrency(Math.round(animatedValue))}
        </span>
        {trend && (
          <TrendIcon size={size === 'lg' ? 20 : 16} className={trendColor} />
        )}
      </div>
    </div>
  );
}
