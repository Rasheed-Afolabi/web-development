import { useEffect, useState, useRef, useCallback, type ReactNode, type ElementType } from 'react';

// ---------- Currency / number helpers ----------

export function fmtUSD(cents: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format((cents || 0) / 100);
}

export function fmtUSDShort(cents: number): string {
  const v = (cents || 0) / 100;
  if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(1) + 'k';
  return '$' + Math.round(v);
}

// ---------- Animated number ----------

export function useAnimatedNumber(target: number, duration: number = 700): number {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    let raf: number;
    const step = (t: number) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

// ---------- Animated currency ----------

interface AnimatedCurrencyProps {
  cents: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCurrency({ cents, decimals = 2, className }: AnimatedCurrencyProps) {
  const v = useAnimatedNumber(cents);
  return <span className={className}>{fmtUSD(Math.round(v), decimals)}</span>;
}

// ---------- Card ----------

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  as?: ElementType;
}

export function RFDCard({ children, className = '', padding = 'p-6', as: Tag = 'div', ...rest }: CardProps) {
  return (
    <Tag
      className={`rfd-card relative rounded-2xl border border-[#1F2937] bg-[#0D1117] ${padding} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ---------- Status pill ----------

interface StatusPillProps {
  status: 'on-track' | 'off-track' | 'danger' | 'neutral' | 'info';
  children: ReactNode;
  size?: 'sm' | 'lg';
}

export function StatusPill({ status, children, size = 'sm' }: StatusPillProps) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    'on-track':  { bg: 'bg-[#0E2A1F]', text: 'text-[#34D399]', border: 'border-[#0F4F36]', dot: 'bg-[#34D399]' },
    'off-track': { bg: 'bg-[#2B1F08]', text: 'text-[#FBBF24]', border: 'border-[#5C3B0B]', dot: 'bg-[#FBBF24]' },
    'danger':    { bg: 'bg-[#2B0F11]', text: 'text-[#F87171]', border: 'border-[#5C1F23]', dot: 'bg-[#F87171]' },
    'neutral':   { bg: 'bg-[#13212F]', text: 'text-[#8BA4BE]', border: 'border-[#234055]', dot: 'bg-[#8BA4BE]' },
    'info':      { bg: 'bg-[#0F1F36]', text: 'text-[#60A5FA]', border: 'border-[#1E3A6B]', dot: 'bg-[#60A5FA]' },
  };
  const s = map[status] || map.neutral;
  const sz = size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-[10.5px] px-2 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${s.bg} ${s.text} ${s.border} ${sz} font-semibold tracking-wide uppercase`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === 'on-track' || status === 'danger' ? 'rfd-pulse' : ''}`} />
      {children}
    </span>
  );
}

// ---------- Section header ----------

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  stack?: boolean;
}

export function SectionTitle({ eyebrow, title, action, stack }: SectionTitleProps) {
  if (stack) {
    return (
      <div className="mb-4">
        {eyebrow && <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7A8BA0] uppercase mb-1">{eyebrow}</p>}
        <h2 className="font-display text-[20px] font-semibold text-[#F0F0F5] tracking-tight leading-tight whitespace-nowrap">{title}</h2>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
  return (
    <div className="mb-4">
      {eyebrow && <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7A8BA0] uppercase mb-1">{eyebrow}</p>}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-[20px] font-semibold text-[#F0F0F5] tracking-tight leading-tight whitespace-nowrap">{title}</h2>
        {action && <div className="flex-shrink-0 max-w-full">{action}</div>}
      </div>
    </div>
  );
}

// ---------- Progress bar ----------

interface BarProps {
  pct: number;
  color?: string;
  className?: string;
  height?: string;
}

export function Bar({ pct, color = '#34D399', className = '', height = 'h-2' }: BarProps) {
  return (
    <div className={`w-full ${height} bg-[#0A0A12] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full rfd-bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

// ---------- Tiny SVG sparkline ----------

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}

export function Sparkline({ values, color = '#60A5FA', height = 32, fill = true }: SparklineProps) {
  const w = 100;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - ((v - min) / range) * height;
    return [x, y] as [number, number];
  });
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = `${linePath} L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {fill && <path d={areaPath} fill={color} opacity="0.12" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Collapsible Section ----------

const COLLAPSE_STORAGE_KEY = 'rfd-collapse-state';

function getCollapseState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCollapseState(id: string, expanded: boolean) {
  const state = getCollapseState();
  state[id] = expanded;
  localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state));
}

interface CollapsibleSectionProps {
  widgetId: string;
  defaultExpanded?: boolean;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  stack?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  widgetId,
  defaultExpanded = true,
  eyebrow,
  title,
  action,
  stack,
  children,
}: CollapsibleSectionProps) {
  const stored = getCollapseState()[widgetId];
  const [expanded, setExpanded] = useState(stored ?? defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(expanded ? 'none' : '0px');

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      setCollapseState(widgetId, next);
      return next;
    });
  }, [widgetId]);

  useEffect(() => {
    if (expanded) {
      const el = contentRef.current;
      if (el) {
        setMaxHeight(el.scrollHeight + 'px');
        const t = setTimeout(() => setMaxHeight('none'), 300);
        return () => clearTimeout(t);
      }
    } else {
      const el = contentRef.current;
      if (el) {
        setMaxHeight(el.scrollHeight + 'px');
        requestAnimationFrame(() => setMaxHeight('0px'));
      }
    }
  }, [expanded]);

  const chevron = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="transition-transform duration-300"
      style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full text-left flex items-start gap-2 group cursor-pointer mb-4"
        aria-expanded={expanded}
      >
        <span className="text-[#7A8BA0] group-hover:text-[#9898B0] mt-0.5 transition-colors flex-shrink-0">
          {chevron}
        </span>
        <div className="flex-1 min-w-0">
          {stack ? (
            <div>
              {eyebrow && (
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7A8BA0] uppercase mb-1">
                  {eyebrow}
                </p>
              )}
              <h2 className="font-display text-[20px] font-semibold text-[#F0F0F5] tracking-tight leading-tight whitespace-nowrap">
                {title}
              </h2>
              {action && <div className="mt-2">{action}</div>}
            </div>
          ) : (
            <div>
              {eyebrow && (
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7A8BA0] uppercase mb-1">
                  {eyebrow}
                </p>
              )}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-display text-[20px] font-semibold text-[#F0F0F5] tracking-tight leading-tight whitespace-nowrap">
                  {title}
                </h2>
                {action && <div className="flex-shrink-0 max-w-full">{action}</div>}
              </div>
            </div>
          )}
        </div>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight, opacity: expanded ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------- Delta Indicator ----------

interface DeltaIndicatorProps {
  currentValue: number;
  previousValue: number;
  format?: 'percent' | 'currency';
  className?: string;
}

export function DeltaIndicator({ currentValue, previousValue, format = 'percent', className = '' }: DeltaIndicatorProps) {
  if (previousValue === 0 && currentValue === 0) return null;

  const diff = currentValue - previousValue;
  const pctChange = previousValue !== 0 ? (diff / previousValue) * 100 : currentValue > 0 ? 100 : 0;
  const isPositive = diff >= 0;
  const color = isPositive ? 'text-[#34D399]' : 'text-[#F87171]';

  let label: string;
  if (format === 'currency') {
    label = (isPositive ? '+' : '') + fmtUSD(diff, 0);
  } else {
    label = (isPositive ? '+' : '') + pctChange.toFixed(0) + '%';
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-medium ${color} ${className}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d={isPositive ? 'M5 2L8 6H2L5 2Z' : 'M5 8L2 4H8L5 8Z'}
          fill="currentColor"
        />
      </svg>
      {label}
    </span>
  );
}
