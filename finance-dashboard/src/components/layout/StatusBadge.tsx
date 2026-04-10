import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import type { PaceStatus } from '@/types';

const statusConfig: Record<PaceStatus, {
  label: string;
  className: string;
  Icon: typeof ArrowUp;
}> = {
  'on-track': {
    label: 'On Track',
    className: 'bg-accent-green-dim text-accent-green animate-pulse-green',
    Icon: ArrowUp,
  },
  'off-track': {
    label: 'Off Track',
    className: 'bg-accent-amber-dim text-accent-amber',
    Icon: ArrowRight,
  },
  'danger': {
    label: 'Danger',
    className: 'bg-accent-red-dim text-accent-red animate-pulse-red',
    Icon: ArrowDown,
  },
};

export function StatusBadge({ status }: { status: PaceStatus }) {
  const { label, className, Icon } = statusConfig[status];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-semibold text-sm ${className}`}>
      <Icon size={16} />
      {label}
    </div>
  );
}
