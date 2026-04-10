import { PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-60">
        <rect x="20" y="30" width="80" height="60" rx="8" stroke="#5A5A72" strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="60" cy="55" r="12" stroke="#5A5A72" strokeWidth="2" />
        <line x1="48" y1="55" x2="72" y2="55" stroke="#5A5A72" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="43" x2="60" y2="67" stroke="#5A5A72" strokeWidth="2" strokeLinecap="round" />
        <path d="M35 80 L60 95 L85 80" stroke="#5A5A72" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
      <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm font-body text-center max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold text-sm rounded-lg hover:scale-[1.02] transition-transform"
        >
          <PlusCircle size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
