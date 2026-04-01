import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency, formatCurrencyCompact } from '@/lib/formatters';
import { MILESTONES } from '@/data/constants';
import type { PaceStatus } from '@/types';

interface SavingsThermometerProps {
  currentSaved: number; // cents
  targetAmount: number; // cents
  paceStatus: PaceStatus;
}

export function SavingsThermometer({ currentSaved, targetAmount, paceStatus }: SavingsThermometerProps) {
  const percent = Math.min(Math.max(currentSaved / targetAmount, 0), 1);
  const animatedPercent = useAnimatedNumber(percent * 100, 1500);

  const glowColor = paceStatus === 'on-track' ? 'rgba(52,211,153,0.3)'
    : paceStatus === 'off-track' ? 'rgba(251,191,36,0.3)'
    : 'rgba(248,113,113,0.3)';

  return (
    <div className="flex items-end gap-8 justify-center py-4">
      {/* Thermometer */}
      <div className="relative w-16 h-[320px] bg-bg-tertiary rounded-full overflow-hidden border border-border-subtle">
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000"
          style={{
            height: `${animatedPercent}%`,
            background: `linear-gradient(to top, #F87171, #FBBF24 50%, #34D399)`,
            boxShadow: `0 -4px 20px ${glowColor}`,
          }}
        />
        {/* Milestone notches */}
        {MILESTONES.map((milestone) => {
          const pos = (milestone / targetAmount) * 100;
          if (pos > 100) return null;
          return (
            <div
              key={milestone}
              className="absolute left-0 right-0 h-px bg-bg-primary/50"
              style={{ bottom: `${pos}%` }}
            >
              <span className="absolute -right-16 -translate-y-1/2 text-text-muted text-[10px] font-mono whitespace-nowrap">
                {formatCurrencyCompact(milestone)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div>
          <p className="text-text-muted text-xs font-body">Saved</p>
          <p className="font-mono font-bold text-3xl text-accent-green">
            {formatCurrency(currentSaved)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs font-body">Target</p>
          <p className="font-mono font-semibold text-lg text-text-secondary">
            {formatCurrency(targetAmount)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs font-body">Progress</p>
          <p className="font-mono font-bold text-lg text-accent-blue">
            {Math.round(percent * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
